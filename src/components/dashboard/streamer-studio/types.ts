import { ObsStudioSceneItemTransform } from "@/lib/types";

export type StreamerStudioStatus = {
  message: string;
  isError: boolean;
};

export type SceneItemSourceSettings = {
  text?: string;
  browserUrl?: string;
  browserWidth?: number;
  browserHeight?: number;
};

export type SourceSettingsMap = Record<number, SceneItemSourceSettings>;

export type BrowserSourceFormInput = {
  url: string;
  width: string;
  height: string;
};

export type DraftTransformsMap = Record<number, ObsStudioSceneItemTransform>;
