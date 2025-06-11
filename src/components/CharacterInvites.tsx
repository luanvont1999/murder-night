// src/components/CharacterInvites.tsx
import React from "react";
import { QRCodeSVG } from "qrcode.react";
// import "../css/CharacterInvites.css"; // Giả sử bạn đã có file CSS này

interface CharacterInvitesProps {
  roomId: string;
  characters: CharacterTemplate[];
  baseUrl?: string;
}

const CharacterInvites: React.FC<CharacterInvitesProps> = ({
  roomId,
  characters,
  baseUrl = window.location.origin,
}) => {
  if (!roomId || !characters || characters.length === 0) {
    return (
      <div className="character-invites-container">
        <p className="invite-instructions">
          Không thể tạo lời mời. Thiếu thông tin phòng hoặc nhân vật.
        </p>
      </div>
    );
  }

  const handleCopyToClipboard = (textToCopy: string, characterName: string) => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        alert(`Đã sao chép link mời cho nhân vật ${characterName} vào clipboard!`);
      })
      .catch(() => {
        alert("Lỗi khi sao chép. Vui lòng sao chép thủ công.");
      });
  };

  return (
    <div className="character-invites-container">
      <h4>
        <span role="img" aria-label="invitation">💌</span> 
        Mời người chơi tham gia
      </h4>
      <p className="invite-instructions">
        Sử dụng link hoặc mã QR dưới đây để mời bạn bè vào vai các nhân vật.
      </p>
      <div className="invites-grid">
        {(characters as CharacterTemplate[]).map((character) => {
          // Sử dụng `character.id` (hoặc `character.name` làm fallback) làm Character ID trong URL
          const characterIdForUrl = character.id || character.name;
          const joinUrl = `${baseUrl}/join-room?roomId=${roomId}&characterId=${characterIdForUrl}`;

          return (
            <div key={characterIdForUrl} className="character-invite-card">
              <h5>{character.name}</h5>
              {character.position && (
                <p className="character-role-invite">({character.position})</p>
              )}
              <div className="qr-code-container">
                <QRCodeSVG
                  value={joinUrl}
                  size={140}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="join-url-actions">
                <input
                  type="text"
                  value={joinUrl}
                  readOnly
                  className="join-url-input"
                  aria-label={`Link mời cho ${character.name}`}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={() => handleCopyToClipboard(joinUrl, character.name)}
                  className="button-small copy-link-button"
                  title={`Sao chép link mời cho ${character.name}`}
                >
                  <span role="img" aria-label="copy">📋</span> Sao chép
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterInvites;