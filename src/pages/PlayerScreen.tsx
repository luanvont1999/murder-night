// src/components/PlayerScreen.tsx
import React, { useState, useEffect, useMemo } from "react"
import { useParams } from "react-router-dom"
import { db } from "@/services/firebase-config"
import {
  doc,
  collection,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore"

import LocationTab from "@/components/tabs/LocationTab"

// Import các icon (nếu bạn dùng thư viện như 'react-icons')
// import { FaUser, FaSearch, FaMapMarkerAlt } from 'react-icons/fa';

// import "./PlayerScreen.css"

const PlayerScreen: React.FC = () => {
  const roomId = useMemo(
    () => localStorage.getItem("roomId"),
    []
  )
  
  const characterId = useMemo(
    () => localStorage.getItem("characterId"),
    []
  )

  // Lấy ID người chơi ẩn danh từ localStorage
  const anonymousPlayerId = useMemo(
    () => localStorage.getItem("anonymousPlayerId"),
    []
  )

  // State dữ liệu
  const [roomData, setRoomData] = useState<GameRoom | null>(null)
  const [allClues, setAllClues] = useState<ClueTemplate[]>([])
  const [allLocations, setAllLocations] = useState<LocationTemplate[]>([])

  // State giao diện
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("character") // Mặc định là tab Nhân vật

  // --- LOGIC LẤY DỮ LIỆU (Giữ nguyên như phiên bản trước) ---
  useEffect(() => {
    if (!roomId) {
      setError("Không tìm thấy ID phòng.")
      setIsLoading(false)
      return
    }

    const roomDocRef = doc(db, "gameRooms", roomId)
    const unsubscribe = onSnapshot(
      roomDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          setRoomData(docSnap.data() as GameRoom)
          if (allClues.length === 0) {
            try {
              const cluesColRef = collection(
                db,
                "gameRooms",
                roomId,
                "roomClues"
              )
              const locationsColRef = collection(
                db,
                "gameRooms",
                roomId,
                "roomLocations"
              )
              const [cluesSnapshot, locationsSnapshot] = await Promise.all([
                getDocs(cluesColRef),
                getDocs(locationsColRef),
              ])
              setAllClues(
                cluesSnapshot.docs.map(
                  (d) => ({ id: d.id, ...d.data() } as ClueTemplate)
                )
              )
              setAllLocations(
                locationsSnapshot.docs.map(
                  (d) => ({ id: d.id, ...d.data() } as LocationTemplate)
                )
              )
            } catch (subError: any) {
              setError(
                `Lỗi khi tải dữ liệu chi tiết của phòng: ${subError.message}`
              )
            }
          }
        } else {
          setError(`Phòng game với ID "${roomId}" không tồn tại.`)
        }
        setIsLoading(false)
      },
      (err) => {
        setError(`Không thể kết nối đến phòng game. Lỗi: ${err.message}`)
        setIsLoading(false)
      }
    )
    return () => unsubscribe()
  }, [roomId, allClues.length])

  // --- DỮ LIỆU DẪN XUẤT (Giữ nguyên) ---
  const playerInstance = useMemo((): Player | null => {
    if (!anonymousPlayerId || !roomData?.players) return null
    return (
      roomData.players.find((p) => p.playerId === anonymousPlayerId) || null
    )
  }, [roomData?.players, anonymousPlayerId])

  const playerCharacter = useMemo((): CharacterTemplate | null => {
    return roomData?.characters.find((c) => c.id === characterId) || null
  }, [roomData?.characters, characterId])

  const knownClues = useMemo((): ClueTemplate[] => {
    if (!playerInstance || !allClues.length) return []
    const inventoryIds = new Set(playerInstance.inventory || [])
    return allClues.filter(
      (clue) =>
        inventoryIds.has(clue.id) ||
        (roomData?.publicClues || []).includes(clue.id)
    )
  }, [allClues, playerInstance, roomData?.publicClues])

  const knownClueIdSet = useMemo((): Set<string> => {
    if (!playerInstance) return new Set()
    // Gộp manh mối trong túi đồ và manh mối công khai
    const allKnownIds = [
      ...(playerInstance.inventory || []),
      ...(roomData?.publicClues || []),
    ]
    return new Set(allKnownIds)
  }, [playerInstance, roomData?.publicClues])

  const handleDiscoverClue = async (clueIdToDiscover: string) => {
    if (!roomId || !playerInstance) return

    // Kiểm tra để không thêm manh mối đã có
    if (playerInstance.inventory.includes(clueIdToDiscover)) {
      console.log("Clue already in inventory.")
      return
    }

    console.log(
      `Player ${playerInstance.displayName} is discovering clue: ${clueIdToDiscover}`
    )

    try {
      const roomDocRef = doc(db, "gameRooms", roomId)

      // Tạo một bản sao của mảng players hiện tại
      const updatedPlayers = roomData?.players.map((player) => {
        // Nếu tìm thấy đúng người chơi hiện tại
        if (player.playerId === playerInstance.playerId) {
          // Trả về một object mới với inventory đã được cập nhật
          return {
            ...player,
            inventory: [...player.inventory, clueIdToDiscover],
          }
        }
        // Nếu không, trả về player object không thay đổi
        return player
      })

      // Cập nhật toàn bộ mảng players trên Firestore
      await updateDoc(roomDocRef, {
        players: updatedPlayers,
      })
    } catch (error) {
      console.error("Lỗi khi cập nhật inventory:", error)
      alert("Không thể khám phá manh mối. Vui lòng thử lại.")
    }
  }

  // --- XỬ LÝ TRẠNG THÁI LOADING/ERROR (Giữ nguyên) ---
  if (isLoading) {
    return <div className="screen-loading-player">Đang tải dữ liệu...</div>
  }
  if (error) {
    return (
      <div className="player-screen-error screen">
        <h2>Lỗi</h2>
        <p>{error}</p>
      </div>
    )
  }
  if (!playerInstance || !playerCharacter) {
    return (
      <div className="player-screen-error screen">
        <h2>Lỗi</h2>
        <p>Không thể xác thực thông tin người chơi hoặc nhân vật.</p>
      </div>
    )
  }

  // --- CẤU TRÚC GIAO DIỆN DI ĐỘNG (JSX) ---
  return (
    <div className="player-screen-wrapper">
      <div className="mobile-screen-container">
        {/* Header của màn hình điện thoại */}
        <header className="screen-header">
          <div className="header-info">
            <span className="room-id">Phòng: {roomId}</span>
            <span className="character-name">Vai: {playerCharacter.name}</span>
          </div>
        </header>

        {/* Thân màn hình, chứa nội dung có thể cuộn */}
        <main className="screen-body">
          {activeTab === "character" && (
            <div className="tab-pane">
              <h2 className="tab-title">Thông tin Nhân vật</h2>
              <div className="info-card">
                <h3>{playerCharacter.name}</h3>
                <p>
                  <strong>Tuổi:</strong> {playerCharacter.age}
                </p>
                <p>
                  <strong>Vị trí:</strong> {playerCharacter.position}
                </p>
              </div>
              <div className="info-card">
                <h4>
                  Mục tiêu "Lương thiện": {playerCharacter.goals.good_path.name}
                </h4>
                <ul>
                  {playerCharacter.goals.good_path.completion_conditions.map(
                    (cond, i) => (
                      <li key={`good-${i}`}>{cond}</li>
                    )
                  )}
                </ul>
              </div>
              <div className="info-card">
                <h4>
                  Mục tiêu "Phản bội": {playerCharacter.goals.evil_path.name}
                </h4>
                <ul>
                  {playerCharacter.goals.evil_path.completion_conditions.map(
                    (cond, i) => (
                      <li key={`evil-${i}`}>{cond}</li>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "clues" && (
            <div className="tab-pane">
              <h2 className="tab-title">Manh Mối ({knownClues.length})</h2>
              {knownClues.length > 0 ? (
                knownClues.map((clue) => (
                  <div key={clue.id} className="clue-card">
                    <strong>{clue.name}</strong>
                    <p>{clue.content}</p>
                  </div>
                ))
              ) : (
                <p className="empty-state">Bạn chưa có manh mối nào.</p>
              )}
            </div>
          )}

          {activeTab === "locations" && (
            <LocationTab
              locations={allLocations}
              knownClueIds={knownClueIdSet}
              onDiscoverClue={handleDiscoverClue}
            />
          )}
        </main>

        {/* Thanh điều hướng dưới đáy màn hình */}
        <nav className="screen-navigation">
          <button
            className={`nav-button ${
              activeTab === "character" ? "active" : ""
            }`}
            onClick={() => setActiveTab("character")}
          >
            {/* <FaUser /> */}
            <span>👤</span>
            <small>Nhân vật</small>
          </button>
          <button
            className={`nav-button ${activeTab === "clues" ? "active" : ""}`}
            onClick={() => setActiveTab("clues")}
          >
            {/* <FaSearch /> */}
            <span>🔍</span>
            <small>Manh mối</small>
          </button>
          <button
            className={`nav-button ${
              activeTab === "locations" ? "active" : ""
            }`}
            onClick={() => setActiveTab("locations")}
          >
            {/* <FaMapMarkerAlt /> */}
            <span>📍</span>
            <small>Địa điểm</small>
          </button>
        </nav>
      </div>
    </div>
  )
}

export default PlayerScreen
