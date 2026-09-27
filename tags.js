/**
 * Project SEAF - Tags Data
 * 게시글 제목 자동완성 및 필터링용 태그 정보
 */

const SEAF_TAGS = {
  // 난이도 (1단 ~ 10단)
  DIFFICULTIES: Array.from({ length: 10 }, (_, i) => (i + 1).toString()),

  // 카테고리 (진영별 분류)
  CATEGORIES: {
    TERMINID: {
      name: "테르미니드",
      emoji: "🐜",
      color: "#f7d954",
      tags: ["프레데터", "럽쳐", "글룸", "하이브월드", "하이브로드"],
      hasDifficulty: true,
      keywords: ["테르미니드", "테르밋", "🐜", "🪳", "벌레", "버그", "벅", "타이탄", "로치"] // 추후 게시글 필터링용
    },
    AUTOMATON: {
      name: "오토마톤",
      emoji: "🤖",
      color: "#e2604e",
      tags: ["소각대", "제트여단", "코만도", "사이버스탠"],
      hasDifficulty: true,
      keywords: ["오토마톤", "🏭", "로봇", "봇", "오토", "오도", "오도마톤", "헐크", "데바", "싱글맘", "토스트"]
    },
    ILLUMINATE: {
      name: "일루미닛",
      emoji: "🦑",
      color: "#9b61b6",
      tags: [],
      hasDifficulty: true,
      keywords: ["일루미닛", "🦑", "오징어", "일루", "일루와잇", "일루와", "스퀴드", "보징어"]
    },
    ANYWHERE: {
      name: "아무데나",
      emoji: "🗺️",
      color: "#f0f0f0",
      tags: [],
      hasDifficulty: true,
      keywords: ["아무데나", "🗺️", "아무", "어디", "ㅇㅁㄷㄴ"]
    },
    CREDIT_RUN: {
      name: "크레딧런",
      emoji: "💎",
      color: "#669ce2",
      tags: [],
      hasDifficulty: false, // 크레딧런은 난이도 선택 불필요
      keywords: ["크레딧런", "💎", "크레딧", "샘플런"]
    }
  }
};