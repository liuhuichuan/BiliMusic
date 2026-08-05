import type { MusicAccess, RankCategory } from "../constants/music";

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  cover: string;
  rank: number;
  previousRank?: number;
  access: MusicAccess;
}

export interface Rank {
  id: number;
  name: string;
  image: string;
  banner: string;
  intro: string;
  frequency: string;
  category: RankCategory;
  color: string;
}

export interface RankDetail {
  info: Rank;
  songs: Song[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PlaybackTrack extends Song {
  audioUrl: string;
  fallbackUrls: string[];
}

export interface RawSong {
  hash?: string;
  filename?: string;
  song_name?: string;
  songname?: string;
  singer_name?: string;
  singername?: string;
  h5_author_name?: string;
  duration?: number;
  album_sizable_cover?: string;
  sort?: number;
  rank_count?: number;
  last_sort?: number;
  pay_type?: number;
  privilege?: number;
}

export interface RawRank {
  rankid?: number;
  rankname?: string;
  imgurl?: string;
  banner7url?: string;
  bannerurl?: string;
  intro?: string;
  update_frequency?: string;
  classify?: number;
  album_cover_color?: string;
}
