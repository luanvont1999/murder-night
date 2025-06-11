// src/components/CreateRoomScreen.tsx
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { db } from "@/services/firebase-config"
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore"

// --- THAY ĐỔI LỚN: IMPORT CÁC FILE JSON RIÊNG LẺ ---
import gameInfoJson from "@/scripts/aurora.json"
import charactersJson from "@/scripts/character.json"
import locationsJson from "@/scripts/location.json"
import cluesJson from "@/scripts/clue.json"

import CharacterInvites from "@/components/CharacterInvites"

// Hàm tạo ID ngẫu nhiên đơn giản
function generateRandomRoomId(length: number = 7): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = "ROOM-"
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

const CreateRoomScreen: React.FC = () => {
  const [roomName, setRoomName] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleCreateRoom = async () => {
    setIsLoading(true)
    setError(null)
    setCreatedRoomId(null)

    const newRoomId =
      roomName.trim().replace(/\s+/g, "-") || generateRandomRoomId()
    if (!newRoomId) {
      setError("Tên phòng không hợp lệ hoặc không thể tạo ID.")
      setIsLoading(false)
      return
    }

    try {
      const batch = writeBatch(db)
      const roomDocRef = doc(db, "gameRooms", newRoomId)

      // 1. Xử lý dữ liệu nhân vật để thêm inventory ban đầu
      const charactersWithInventory = (
        charactersJson as CharacterTemplate[]
      ).map((character) => ({
        ...character,
        id: character.name,
        inventory: character.starting_item ? [character.starting_item] : [],
      }))

      // 2. Tạo document chính cho phòng game từ các file JSON đã import
      const roomData: Omit<GameRoom, "createdAt"> = {
        // Bỏ createdAt vì sẽ được gán bởi serverTimestamp
        id: newRoomId,
        name: roomName.trim() || `Phòng ${newRoomId}`,
        templateId: "occasusAurora_v2", // Đặt tên template mới nếu cần
        gameTitle: (gameInfoJson as GameInfoTemplate).gameTitle,
        gameStory: (gameInfoJson as GameInfoTemplate).gameStory,
        status: "waiting",
        players: [],
        publicClues: [],
        characters: charactersWithInventory, // Sử dụng dữ liệu nhân vật đã xử lý
        // Các trường khác như victim, setting, gameRules có thể thêm vào nếu cần
      }
      batch.set(roomDocRef, { ...roomData, createdAt: serverTimestamp() })

      // 3. Tạo subcollection 'roomLocations' từ location.json
      const locationsColRef = collection(
        db,
        "gameRooms",
        newRoomId,
        "roomLocations"
      )
      ;(locationsJson as LocationTemplate[]).forEach((location) => {
        const { id, ...locationData } = location
        const locDocRef = doc(locationsColRef, id)
        // Dữ liệu đã đơn giản, chỉ cần set trực tiếp
        batch.set(locDocRef, locationData)
      })

      // 4. Tạo subcollection 'roomClues' từ clue.json và thêm trạng thái
      const cluesColRef = collection(db, "gameRooms", newRoomId, "roomClues")
      ;(cluesJson as ClueTemplate[]).forEach((clue) => {
        const { id, ...clueData } = clue
        const clueWithState = {
          ...clueData,
          isPubliclyRevealed: false, // Thêm trạng thái ban đầu
          foundBy: null,
        }
        const clueDocRef = doc(cluesColRef, id)
        batch.set(clueDocRef, clueWithState)
      })

      // 5. Commit tất cả thao tác
      await batch.commit()

      setCreatedRoomId(newRoomId)
      console.log(`Phòng game "${newRoomId}" đã được tạo thành công.`)
    } catch (err: any) {
      console.error("Lỗi khi tạo phòng trên Firestore:", err)
      setError(err.message || "Không thể tạo phòng. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  // --- PHẦN GIAO DIỆN (JSX) GIỮ NGUYÊN ---
  // Không cần thay đổi gì ở phần return, vì nó đã hoạt động với các state hiện tại.

  const handleCopyToClipboard = () => {
    if (createdRoomId) {
      navigator.clipboard
        .writeText(createdRoomId)
        .then(() => alert("Đã sao chép ID phòng vào clipboard!"))
        .catch(() =>
          alert("Không thể sao chép ID phòng. Vui lòng sao chép thủ công.")
        )
    }
  }

  const handleJoinCreatedRoomAsGM = () => {
    if (createdRoomId) {
      navigate(`/gm/room/${createdRoomId}`)
    }
  }

  return (
    <div className="create-room-screen screen">
      <header className="screen-header">
        <button onClick={() => navigate("/")} className="back-button-header">
          ‹ Trang chủ
        </button>
        <h2>Tạo Phòng Chơi Mới</h2>
        <div></div>
      </header>
      <div className="screen-content">
        <div className="form-container">
          <div className="form-group">
            <label htmlFor="roomName">Tên Phòng (Tùy chọn):</label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder={`Ví dụ: Vụ án tại K-Star (${new Date().toLocaleDateString()})`}
              disabled={isLoading}
              aria-describedby="roomNameHelp"
            />
            <small id="roomNameHelp" className="form-text text-muted">
              Nếu để trống, ID phòng sẽ được tạo ngẫu nhiên.
            </small>
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="button-primary create-button"
          >
            {isLoading ? (
              <>
                <span className="spinner" /> Đang tạo phòng...
              </>
            ) : (
              "🚀 Tạo Phòng Điều Tra"
            )}
          </button>
        </div>

        {error && <p className="error-message create-room-error">{error}</p>}

        {createdRoomId && (
          <div className="created-room-info">
            <h3>🎉 Tạo phòng thành công! 🎉</h3>
            <p>ID Phòng của bạn là:</p>
            <div className="room-id-display">
              <strong>{createdRoomId}</strong>
            </div>
            <button
              onClick={handleCopyToClipboard}
              className="button-secondary copy-button"
            >
              <span role="img" aria-label="copy">
                📋
              </span>{" "}
              Sao chép ID Phòng
            </button>
            <p className="share-info">
              Bạn có thể chia sẻ ID này với Quản Trò (nếu bạn không phải) hoặc
              sử dụng các link mời nhân vật ở dưới.
            </p>
            <button
              onClick={handleJoinCreatedRoomAsGM}
              className="button-primary join-created-button"
            >
              <span role="img" aria-label="gm-hat">
                👑
              </span>{" "}
              Vào Phòng Với Tư Cách Quản Trò
            </button>

            {(charactersJson as CharacterTemplate[])?.length > 0 ? (
              <CharacterInvites
                roomId={createdRoomId}
                characters={charactersJson as CharacterTemplate[]}
              />
            ) : (
              <p className="warning-message">
                Lưu ý: Template game hiện tại không có thông tin nhân vật hoặc
                có lỗi khi tải. Không thể tạo link mời.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateRoomScreen
