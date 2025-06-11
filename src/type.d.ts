// src/types.d.ts
// =================================================================
// I. CÁC KIỂU DỮ LIỆU CHO TEMPLATE GỐC (Source Data)
//    (Định nghĩa cấu trúc cho các file .json của bạn)
// =================================================================

/**
 * Định nghĩa cấu trúc cho một mục tiêu của nhân vật.
 */
interface CharacterGoal {
  name: string;
  completion_conditions: string[];
}

/**
 * Định nghĩa cấu trúc cho một nhân vật trong file template (character.json).
 */
interface CharacterTemplate {
  id: string; // ID định danh (ví dụ: 'LEO', 'SOL')
  name: string;
  age: number;
  position: string; // Hoặc 'role'
  storyWithVictim?: string;
  relationships?: Record<string, string>;
  secrets?: {
    personalOrVictimRelated?: string;
  };
  starting_item: string; // ID của vật phẩm/manh mối khởi đầu
  goals: {
    good_path: CharacterGoal;
    evil_path: CharacterGoal;
  };
  // Thêm inventory ở đây là không bắt buộc cho template,
  // nhưng có thể thêm vào khi tạo phòng chơi.
  inventory?: string[];
}

/**
 * Định nghĩa cấu trúc cho một manh mối trong file template (clue.json).
 */
interface ClueTemplate {
  id: string; // ID định danh của manh mối (ví dụ: 'K2', 'MD1')
  name: string;
  location: string;
  content: string;
  purpose: string;
  gm_explanation: string;
}

/**
 * Định nghĩa cấu trúc cho một địa điểm trong file template (location.json).
 */
interface InteractiveItem {
  id: string; // ID duy nhất của vật phẩm, ví dụ: "ITEM_SAFE"
  name: string; // Tên hiển thị, ví dụ: "Két sắt nhỏ (Bị khóa)"
  description: string;
  
  // Trạng thái tương tác
  isLocked: boolean;
  passwordHint?: string;
  
  // Dành riêng cho tủ đồ của người chơi
  characterOwnerId?: string; 
  
  // Manh mối tìm được khi tương tác với vật phẩm này
  discoverableClueIds: string[];
}


interface LocationTemplate {
  id: string; // ID của địa điểm chính, ví dụ: "LOC_OFFICE"
  name: string;
  description: string;
  
  // Manh mối tìm thấy khi khám xét chung khu vực này
  generalClueIds: string[]; 
  
  // Danh sách các vật phẩm/khu vực con có thể tương tác (Lớp 2)
  items: InteractiveItem[];

}

/**
 * Định nghĩa cấu trúc tổng quan cho file dữ liệu game chính (aurora.json).
 */
interface GameInfoTemplate {
  gameTitle: string;
  gameStory: string;
  victim: {
    name: string;
    age: number;
    gender: string;
    role: string;
  };
  setting: {
    mainLocation: string;
    time: string;
  };
  gameRules: {
    estimatedTime: string;
    truthAndLieLaw: string;
    currency: {
      name: string;
      startingAmount: number;
    };
    cluePurchase: {
      costPerClue: number;
      maxPurchasePerPlayer: number;
    };
  };
}

// =================================================================
// II. CÁC KIỂU DỮ LIỆU CHO TRẠNG THÁI GAME ĐANG DIỄN RA (Live Game State)
//     (Định nghĩa cấu trúc dữ liệu trên Firestore cho một phòng chơi)
// =================================================================

/**
 * Định nghĩa trạng thái của một người chơi đã tham gia vào phòng.
 */
interface Player {
  playerId: string;       // ID ẩn danh duy nhất được lưu trong localStorage
  characterId: string;    // ID nhân vật người này đảm nhận
  characterName: string;
  displayName: string;    // Tên hiển thị do người chơi tự nhập
  inventory: string[];
}
/**
 * Định nghĩa trạng thái của một manh mối trong phòng chơi.
 * Kế thừa từ ClueTemplate và thêm các trường trạng thái.
 */
interface RoomClue extends ClueTemplate {
  isPubliclyRevealed: boolean; // Trạng thái đã được công khai cho cả phòng hay chưa
  foundBy: string | null;      // userId của người đầu tiên tìm thấy
}

/**
 * Định nghĩa trạng thái của một địa điểm trong phòng chơi.
 * Hiện tại giống LocationTemplate, nhưng có thể mở rộng nếu cần trạng thái động.
 */


/**
 * Định nghĩa cấu trúc cho document chính của một phòng game trên Firestore.
 */
interface GameRoom {
  id: string; // ID của phòng, trùng với ID document
  name: string; // Tên phòng do người dùng đặt
  templateId: string; // ID của template game được sử dụng (ví dụ: 'occasusAurora')
  status: 'waiting' | 'playing' | 'finished'; // Trạng thái hiện tại của phòng
  createdAt: Timestamp;

  // Sao chép thông tin chung từ template để dễ truy cập
  gameTitle: string;
  gameStory: string;
  
  // Sao chép danh sách nhân vật từ template và có thể thêm trạng thái động
  characters: CharacterTemplate[];

  // Danh sách người chơi và trạng thái của họ
  players: Player[];

  // Danh sách ID các manh mối đã được công khai
  publicClues: string[];
}