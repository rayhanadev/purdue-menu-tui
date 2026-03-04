import { useState, useEffect } from "react";
import { fetchItemDetail } from "../lib/api";
import { displayDate } from "../lib/date";
import { isMajorNutrient, isSubNutrient, getUpcomingAppearances } from "../lib/items.ts";
import { runEffect } from "../lib/effects.ts";
import { CenteredMessage } from "./CenteredMessage.tsx";
import type { Item, NutritionFact, AsyncState } from "../lib/types";

interface ItemDetailProps {
  itemId: string;
  itemName: string;
}

export function ItemDetail({ itemId, itemName }: ItemDetailProps) {
  const [state, setState] = useState<AsyncState<Item>>({
    data: null,
    error: null,
    loading: true,
  });
  useEffect(() => {
    runEffect(fetchItemDetail(itemId), setState);
  }, [itemId]);

  const { data: item, error, loading } = state;

  if (error) return <CenteredMessage color="#FF6B6B">Error loading item: {error}</CenteredMessage>;
  if (loading) return <CenteredMessage>Loading {itemName}...</CenteredMessage>;
  if (!item) return <CenteredMessage>Item not found.</CenteredMessage>;

  const nutritionFacts = item.nutritionFacts ?? [];
  const traits = item.traits ?? [];
  const upcomingAppearances = getUpcomingAppearances(item.appearances ?? []);

  return (
    <scrollbox flexGrow={1} focused>
      <box flexDirection="column" paddingX={1} paddingY={1} gap={1}>
        <text fg="#CEB888">
          <strong>{item.name}</strong>
        </text>

        {traits.length > 0 ? (
          <box flexDirection="row" gap={1} flexWrap="wrap">
            {traits.map((t) => (
              <text key={t.id} fg="#888888">
                [{t.name}]
              </text>
            ))}
          </box>
        ) : null}

        {nutritionFacts.length > 0 ? (
          <box
            flexDirection="column"
            border
            borderStyle="single"
            borderColor="#555555"
            title="Nutrition Facts"
            titleAlignment="center"
          >
            {nutritionFacts.map((fact, i) => (
              <NutritionRow key={i} fact={fact} indent={isSubNutrient(fact.name)} />
            ))}
          </box>
        ) : (
          <text fg="#888888">No nutrition information available.</text>
        )}

        {item.ingredients ? (
          <box
            flexDirection="column"
            border
            borderStyle="single"
            borderColor="#555555"
            title="Ingredients"
            titleAlignment="center"
            paddingX={1}
          >
            <text fg="#CCCCCC">{item.ingredients}</text>
          </box>
        ) : null}

        {upcomingAppearances.length > 0 ? (
          <box
            flexDirection="column"
            border
            borderStyle="single"
            borderColor="#555555"
            title="Upcoming"
            titleAlignment="center"
          >
            {upcomingAppearances.map((a, i) => {
              const dateStr = displayDate(new Date(a.date));
              return (
                <box key={i} flexDirection="row" paddingX={1} gap={1}>
                  <text fg="#888888" width={16}>
                    {dateStr}
                  </text>
                  <text fg="#AAAAAA">{a.locationName}</text>
                  <text fg="#666666">
                    {a.mealName} / {a.stationName}
                  </text>
                </box>
              );
            })}
          </box>
        ) : null}
      </box>
    </scrollbox>
  );
}

function NutritionRow({ fact, indent }: { fact: NutritionFact; indent?: boolean }) {
  const prefix = indent ? "  " : "";
  const nameStr = `${prefix}${fact.name ?? "Unknown"}`;
  const valueStr = fact.label ?? (fact.value != null ? String(fact.value) : "");
  const dvStr = fact.dailyValueLabel ?? "";

  return (
    <box flexDirection="row" justifyContent="space-between" paddingX={1}>
      <text fg="#AAAAAA">
        {isMajorNutrient(fact.name) ? <strong>{nameStr}</strong> : nameStr}
        {valueStr ? ` ${valueStr}` : ""}
      </text>
      {dvStr ? <text fg="#555555">{dvStr}</text> : null}
    </box>
  );
}
