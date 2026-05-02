import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemTransform } from "@/lib/types";

type TransformEditorProps = {
  t: DashboardText;
  transform: ObsStudioSceneItemTransform;
  onUpdateField: (raw: string, min: number, max: number, field: keyof ObsStudioSceneItemTransform) => void;
};

export function TransformEditor({ t, transform, onUpdateField }: TransformEditorProps) {
  return (
    <div className="streamer-transform-grid">
      <label className="streamer-transform-field">
        <span>{t.streamerStudioTransformX}</span>
        <input
          type="number"
          value={transform.positionX}
          onChange={(event) => onUpdateField(event.target.value, -10000, 10000, "positionX")}
        />
      </label>
      <label className="streamer-transform-field">
        <span>{t.streamerStudioTransformY}</span>
        <input
          type="number"
          value={transform.positionY}
          onChange={(event) => onUpdateField(event.target.value, -10000, 10000, "positionY")}
        />
      </label>
      <label className="streamer-transform-field">
        <span>{t.streamerStudioTransformScaleX}</span>
        <input
          type="number"
          step="0.01"
          value={transform.scaleX}
          onChange={(event) => onUpdateField(event.target.value, 0.05, 10, "scaleX")}
        />
      </label>
      <label className="streamer-transform-field">
        <span>{t.streamerStudioTransformScaleY}</span>
        <input
          type="number"
          step="0.01"
          value={transform.scaleY}
          onChange={(event) => onUpdateField(event.target.value, 0.05, 10, "scaleY")}
        />
      </label>
      <label className="streamer-transform-field">
        <span>{t.streamerStudioTransformRotation}</span>
        <input
          type="number"
          step="0.1"
          value={transform.rotation}
          onChange={(event) => onUpdateField(event.target.value, -360, 360, "rotation")}
        />
      </label>
    </div>
  );
}
