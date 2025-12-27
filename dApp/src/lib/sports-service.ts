// src/lib/sports-service.ts
import axios from 'axios';
import { BettingMatch } from '@/types';

// You need to get a free key from https://the-odds-api.com/
// Ensure the API key is pulling from env:
// src/lib/sports-service.ts
const API_KEY = import.meta.env.VITE_ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4/sports';

export const SPORT_KEYS = {
  soccer: 'soccer_epl', // Premier League
  basketball: 'basketball_nba',
  mma: 'mma_mixed_martial_arts',
  american_football: 'americanfootball_nfl',
  tennis: 'tennis_atp_us_open',
};

// Map API response to your UI structure
const mapToBettingMatch = (data: any, sportKey: string): BettingMatch => {
  // Find H2H market
  const h2h = data.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'h2h');
  const outcomes = h2h?.outcomes || [];

  const home = outcomes.find((o: any) => o.name === data.home_team);
  const away = outcomes.find((o: any) => o.name === data.away_team);
  const draw = outcomes.find((o: any) => o.name === 'Draw');

  return {
    id: data.id,
    sport: sportKey as any,
    league: data.sport_title,
    homeTeam: data.home_team,
    awayTeam: data.away_team,
    startTime: new Date(data.commence_time).getTime(),
    isLive: false, // The free tier usually doesn't provide live-in-play status easily
    score: undefined, 
    markets: {
      h2h: [
        home?.price || 1.01,
        draw?.price || 1.01, // Some sports don't have draws
        away?.price || 1.01
      ]
    }
  };
};

export const fetchLiveMatches = async (sport: string): Promise<BettingMatch[]> => {
  try {
    // In production, cache this response to avoid hitting API limits
    const response = await axios.get(`${BASE_URL}/${sport}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: 'eu', // eu = decimal odds
        markets: 'h2h',
        oddsFormat: 'decimal',
      }
    });

    return response.data.map((match: any) => mapToBettingMatch(match, sport));
  } catch (error) {
    console.error("Failed to fetch odds", error);
    return []; // Return empty or fallback to mock data on error
  }
};