"use client";

import { useMemo, type ReactNode } from "react";
import type { Match, MatchCelebrationPhotos } from "@/types";
import { pickMatchEndQuote } from "@/lib/quotes/pickQuote";
import {
  getChampionPlayer,
  getRunnerUpPlayer,
} from "@/lib/quotes/matchContext";
import { getFighterIcon } from "@/lib/fighters/stats";
import { fighterNameKey } from "@/lib/fighters/keys";
import type { AppData } from "@/types";
import { Leaderboard } from "@/components/match/Leaderboard";
import { getLeaderboard } from "@/lib/scoring";
import { MatchCelebrationBackground } from "@/components/match/MatchCelebrationBackground";
import { MatchPhotoCapture } from "@/components/match/MatchPhotoCapture";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function MatchEndScreen({
  match,
  data,
  toxicQuotesEnabled,
  onHome,
  onPhotosChange,
  children,
}: {
  match: Match;
  data: AppData;
  toxicQuotesEnabled?: boolean;
  onHome: () => void;
  onPhotosChange: (photos: MatchCelebrationPhotos) => void;
  children?: ReactNode;
}) {
  const quote = useMemo(
    () => pickMatchEndQuote(match, { toxicEnabled: toxicQuotesEnabled }),
    [match, toxicQuotesEnabled]
  );

  const champion = getChampionPlayer(match);
  const runnerUp = getRunnerUpPlayer(match);
  const championIcon = champion
    ? getFighterIcon(data, fighterNameKey(champion.name))
    : undefined;
  const runnerIcon = runnerUp
    ? getFighterIcon(data, fighterNameKey(runnerUp.name))
    : undefined;

  const showLeaderboard =
    match.matchType === "roundRobin" && match.players.length > 2;
  const leaderboard = showLeaderboard
    ? getLeaderboard(match.players, match.pairings)
    : null;

  return (
    <div>
      <MatchCelebrationBackground
        photos={match.celebrationPhotos}
        className="rounded-2xl mb-4 -mx-1"
        overlayClassName="bg-gradient-to-b from-arena-black/60 via-arena-black/80 to-arena-black/95"
      >
        <div className="px-3 pt-4 pb-5">
          <h2 className="text-xl font-bold text-arena-neon mb-2 drop-shadow">
            {match.name}
          </h2>
          <Card glow className="text-center py-6 mb-0 bg-arena-card/80 backdrop-blur-sm">
            <p className="text-sm text-gray-500">比賽結束</p>
            <p className="text-2xl font-bold text-arena-purple mt-2">
              {championIcon && <span className="mr-1">{championIcon}</span>}
              冠軍：{champion?.name ?? "—"}
            </p>
            {runnerUp && (
              <p className="text-sm text-gray-400 mt-2">
                {runnerIcon && <span className="mr-1">{runnerIcon}</span>}
                亞軍：{runnerUp.name}
              </p>
            )}
          </Card>
        </div>
      </MatchCelebrationBackground>

      {champion && (
        <MatchPhotoCapture
          championName={champion.name}
          runnerUpName={runnerUp?.name}
          photos={match.celebrationPhotos}
          onChange={onPhotosChange}
        />
      )}

      <Card className="mb-4 border-arena-purple/40 bg-arena-purple/5">
        <p className="text-xs text-arena-purple mb-1">賽後評語</p>
        <p className="text-base leading-relaxed">{quote.text}</p>
      </Card>

      {showLeaderboard && leaderboard && (
        <Leaderboard
          entries={leaderboard}
          highlightId={match.winnerPlayerId}
        />
      )}

      {children}

      <Button fullWidth className="mt-4" onClick={onHome}>
        返回首頁
      </Button>
    </div>
  );
}
