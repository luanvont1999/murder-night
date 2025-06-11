// src/components/tabs/LocationTab.tsx
import React, { useState } from "react"
interface LocationTabProps {
  locations: LocationTemplate[]
  knownClueIds: Set<string>
  onDiscoverClue: (clueId: string) => void
}

const LocationTab: React.FC<LocationTabProps> = ({
  locations,
  knownClueIds,
  onDiscoverClue,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationTemplate | null>(
    null
  )
  const [feedback, setFeedback] = useState<string>("")

  const handleSearch = (clueIds: string[]) => {
    const discoverableClues = clueIds.filter((id) => !knownClueIds.has(id))
    if (discoverableClues.length > 0) {
      const clueToDiscover = discoverableClues[0]
      onDiscoverClue(clueToDiscover)
      setFeedback(`Bạn đã tìm thấy một manh mối mới!`)
      setTimeout(() => setFeedback(""), 3000)
    }
  }

  const handleUnlockAttempt = (password: string) => {
    alert(
      `Bạn đã thử mở khóa với mật khẩu: ${password}. (Chức năng đang phát triển)`
    )
  }

  // --- RENDER CHI TIẾT ĐỊA ĐIỂM (LỚP 1) VÀ CÁC VẬT PHẨM (LỚP 2) BÊN TRONG ---
  if (selectedLocation) {
    const generalDiscoverableCount = selectedLocation.generalClueIds.filter(
      (id: string) => !knownClueIds.has(id)
    ).length
    return (
      <div className="tab-pane active">
        <button
          onClick={() => setSelectedLocation(null)}
          className="back-button"
        >
          ‹ Tất cả Địa điểm
        </button>
        <h2 className="tab-title">{selectedLocation.name}</h2>
        <p>{selectedLocation.description}</p>

        {/* Tìm kiếm chung trong khu vực */}
        <div className="search-section">
          <button
            onClick={() => handleSearch(selectedLocation.generalClueIds)}
            className="button-primary search-button"
            disabled={generalDiscoverableCount === 0}
          >
            {generalDiscoverableCount > 0
              ? `🔍 Khám xét chung`
              : `✅ Đã khám xét khu vực này`}
          </button>
          {feedback && <p className="discovery-feedback">{feedback}</p>}
        </div>
        <hr />
        <h4>Vật phẩm/Khu vực cụ thể:</h4>
        {selectedLocation.items.map((item: InteractiveItem) => {
          const itemDiscoverableCount = item.discoverableClueIds.filter(
            (id: string) => !knownClueIds.has(id)
          ).length
          return (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <h5>
                  {item.name} {item.isLocked && "🔒"}
                </h5>
              </div>
              <p className="item-description">{item.description}</p>
              {!item.isLocked ? (
                <button
                  onClick={() => handleSearch(item.discoverableClueIds)}
                  disabled={itemDiscoverableCount === 0}
                >
                  {itemDiscoverableCount > 0
                    ? `Khám xét (${itemDiscoverableCount})`
                    : "Đã khám xét hết"}
                </button>
              ) : (
                <div className="unlock-section-inline">
                  {item.passwordHint && (
                    <p className="hint">Gợi ý: {item.passwordHint}</p>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleUnlockAttempt(e.currentTarget.password.value)
                    }}
                  >
                    <input
                      type="text"
                      name="password"
                      placeholder="Mật khẩu..."
                      className="password-input"
                    />
                    <button type="submit" className="unlock-button">
                      Mở
                    </button>
                  </form>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // --- RENDER DANH SÁCH ĐỊA ĐIỂM LỚN (LỚP 1) ---
  return (
    <div className="tab-pane active">
      <h2 className="tab-title">Các Địa Điểm</h2>
      {locations.map((loc) => (
        <div
          key={loc.id}
          className="location-list-item"
          onClick={() => setSelectedLocation(loc)}
        >
          <div className="location-name">{loc.name}</div>
          <div className="location-action">Vào trong ›</div>
        </div>
      ))}
    </div>
  )
}

export default LocationTab
