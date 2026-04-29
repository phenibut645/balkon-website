import { DashboardText } from "@/lib/dashboardText";
import { CraftRecipe } from "@/lib/types";

type CraftPanelProps = {
  t: DashboardText;
  loadingGifs: string[];
  recipes: CraftRecipe[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

export function CraftPanel({ t, loadingGifs, recipes, loading, error, onRefresh }: CraftPanelProps) {
  return (
    <div className="panel panel-craft">
      <div className="craft-scroll">
        {loading ? (
          <div className="loading-block slim">
            <p className="state-text">{t.craftLoading}</p>
            <div className="loading-gif-strip small">
              {loadingGifs.map((src, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={`craft-${src}-${index}`} src={src} alt="Loading" className="loading-gif" />
              ))}
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="admin-empty-card">
            <p className="state-text state-error">{error}</p>
            <button className="pagination-btn" onClick={onRefresh}>{t.craftRefresh}</button>
          </div>
        ) : null}

        {!loading && !error && recipes.length === 0 ? (
          <p className="state-text state-empty">{t.craftEmpty}</p>
        ) : null}

        {!loading && !error && recipes.length > 0 ? (
          <div className="craft-grid">
            {recipes.map(recipe => (
              <article className="craft-card" key={recipe.recipeId}>
                <h3 className="craft-title">{recipe.name}</h3>
                <p className="craft-description">{recipe.description || "-"}</p>

                <div className="craft-result">
                  <p className="craft-label">{t.craftResult}</p>
                  <div className="craft-result-item">
                    <span className="craft-result-emoji">{recipe.resultEmoji || "📦"}</span>
                    <div>
                      <p className="craft-result-name">{recipe.resultName}</p>
                      <p className="craft-result-meta">{recipe.resultRarityName} • x{recipe.resultAmount}</p>
                    </div>
                  </div>
                </div>

                <div className="craft-ingredients">
                  <p className="craft-label">{t.craftIngredients}</p>
                  {recipe.ingredients.length > 0 ? (
                    <div className="craft-ingredients-list">
                      {recipe.ingredients.map(ingredient => (
                        <div className="craft-ingredient" key={`${recipe.recipeId}-${ingredient.itemTemplateId}`}>
                          <span className="craft-ingredient-emoji">{ingredient.emoji || "📦"}</span>
                          <span className="craft-ingredient-name">{ingredient.name}</span>
                          <span className="craft-ingredient-amount">x{ingredient.amount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="state-text state-empty">-</p>
                  )}
                </div>

                <div className="craft-meta">
                  <span className="meta-badge">{t.craftRecipeId} #{recipe.recipeId}</span>
                  <span className="meta-badge">{t.craftResultItemId} #{recipe.resultItemTemplateId}</span>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
