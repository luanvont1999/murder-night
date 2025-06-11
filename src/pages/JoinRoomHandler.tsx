// src/components/JoinRoomHandler.tsx
import React, { useEffect, useState, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { db } from "@/services/firebase-config"
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"
// import "./JoinRoomHandler.css" // Giữ lại file CSS để hiển thị trạng thái loading/error

// Hàm để lấy hoặc tạo Player ID ẩn danh từ localStorage
const getOrSetPlayerId = (): string => {
  const storedId = localStorage.getItem("anonymousPlayerId")
  if (storedId) {
    return storedId
  }
  const newId = uuidv4()
  localStorage.setItem("anonymousPlayerId", newId)
  return newId
}

const JoinRoomHandler: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [statusMessage, setStatusMessage] = useState<string>(
    "Đang kiểm tra lời mời..."
  )
  const [error, setError] = useState<string>("")

  const processJoinRequest = useCallback(async () => {
    const playerId = getOrSetPlayerId()
    const queryParams = new URLSearchParams(location.search)
    const roomId = queryParams.get("roomId")
    const characterId = queryParams.get("characterId")

    if (!roomId || !characterId) {
      setError("Link mời không hợp lệ.")
      return
    }

    try {
      const roomDocRef = doc(db, "gameRooms", roomId)
      const roomSnap = await getDoc(roomDocRef)

      if (!roomSnap.exists()) {
        setError(`Phòng game với ID "${roomId}" không tồn tại.`)
        return
      }

      const roomData = roomSnap.data() as GameRoom
      const characterTemplate = roomData.characters?.find(
        (c) => c.name === characterId
      )

      if (!characterTemplate) {
        setError(`Nhân vật "${characterId}" không hợp lệ cho phòng này.`)
        return
      }

      // Kiểm tra xem vai này đã có ai nhận chưa hoặc chính người này đã nhận chưa
      const playerSlot = roomData.players?.find(
        (p) => p.characterId === characterId
      )
      if (playerSlot && playerSlot.playerId !== playerId) {
        setError(
          `Rất tiếc, vai nhân vật "${characterTemplate.name}" đã được người khác chọn.`
        )
        return
      }

      // Nếu người chơi này đã có trong phòng, chuyển thẳng vào game
      if (playerSlot && playerSlot.playerId === playerId) {
        navigate(`/room/${roomId}/as/${characterId}`, { replace: true })
        return
      }

      // --- LOGIC MỚI: TỰ ĐỘNG THÊM NGƯỜI CHƠI VÀ ĐIỀU HƯỚNG ---
      setStatusMessage(`Tham gia với vai ${characterTemplate.name}...`)

      const newPlayer: Player = {
        playerId: playerId,
        characterId: characterId,
        characterName: characterTemplate.name,
        displayName: characterTemplate.name, // <-- Tự động dùng tên nhân vật làm tên hiển thị
        inventory: characterTemplate.starting_item
          ? [characterTemplate.starting_item]
          : [],
      }

      await updateDoc(roomDocRef, {
        players: arrayUnion(newPlayer),
      })

      // Điều hướng ngay lập tức đến màn hình chơi game
      localStorage.setItem("roomId", roomId)
      localStorage.setItem("characterId", characterId)
      navigate(`/`, { replace: true })
    } catch (err: unknown) {
      console.error("Lỗi khi tham gia phòng:", err)
      setError(err instanceof Error ? err.message : "Không thể tham gia phòng. Vui lòng thử lại.")
    }
  }, [location.search, navigate])

  useEffect(() => {
    processJoinRequest()
  }, [processJoinRequest])

  // Component này giờ chỉ hiển thị trạng thái loading hoặc error
  if (error) {
    return (
      <div className="join-room-status-container">
        <div className="error-message-join">
          <h3>❌ Lỗi Khi Tham Gia Phòng</h3>
          <p>{error}</p>
          <button onClick={() => navigate("/")} className="button-primary">
            Về Trang Chủ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="join-room-status-container">
      <div className="spinner-join"></div>
      <p>{statusMessage}</p>
    </div>
  )
}

export default JoinRoomHandler
