import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneView } from "@/lib/types";

type SceneToolbarProps = {
  t: DashboardText;
  scenes: ObsStudioSceneView[];
  selectedSceneName: string;
  currentSceneName: string | null;
  scenesLoading: boolean;
  onSelectScene: (sceneName: string) => void;
};

export function SceneToolbar({
  t,
  scenes,
  selectedSceneName,
  currentSceneName,
  scenesLoading,
  onSelectScene,
}: SceneToolbarProps) {
  return (
    <div className="streamer-scene-toolbar">
      <label className="market-card-hint" htmlFor="sceneSelect">{t.streamerStudioSelectScene}</label>
      <select
        id="sceneSelect"
        className="searchable-select streamer-scene-select"
        value={selectedSceneName}
        onChange={(event) => onSelectScene(event.target.value)}
        disabled={scenesLoading || scenes.length === 0}
      >
        {scenes.length === 0 ? (
          <option value="">{t.streamerStudioNoScenes}</option>
        ) : (
          scenes.map(scene => (
            <option key={scene.name} value={scene.name}>
              {scene.name}{currentSceneName === scene.name ? " • live" : ""}
            </option>
          ))
        )}
      </select>
      {scenesLoading ? <span className="state-text compact">{t.streamerStudioLoadingScenes}</span> : null}
    </div>
  );
}
