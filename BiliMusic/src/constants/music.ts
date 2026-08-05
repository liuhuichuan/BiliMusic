/**
 * 酷狗接口用数字表示榜单分类。集中定义后，业务代码不再出现难懂的 1、2、3。
 */
export enum RankCategory {
  Popular = 1,
  Region = 2,
  Feature = 3,
  Global = 4,
  Genre = 5,
}

export const RANK_CATEGORIES = [
  { id: RankCategory.Popular, label: "热门" },
  { id: RankCategory.Region, label: "地区" },
  { id: RankCategory.Feature, label: "特色" },
  { id: RankCategory.Global, label: "全球" },
  { id: RankCategory.Genre, label: "曲风" },
] as const;

/** 歌曲在来源接口中的版权类型。 */
export enum MusicAccess {
  Free = "free",
  Paid = "paid",
  Vip = "vip",
}

export const MUSIC_ACCESS_LABEL: Record<MusicAccess, string> = {
  [MusicAccess.Free]: "",
  [MusicAccess.Paid]: "付费",
  [MusicAccess.Vip]: "VIP",
};
