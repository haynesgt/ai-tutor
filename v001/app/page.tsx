'use client';

import Image from "next/image";
import { useState, useEffect, useReducer, use } from "react";

const flashcards = [
  { front: "Amicus", back: "Friend" },
  { front: "Aqua", back: "Water" },
  { front: "Bellum", back: "War" },
  { front: "Caelum", back: "Sky" },
  { front: "Corpus", back: "Body" },
  { front: "Dies", back: "Day" },
  { front: "Domus", back: "House" },
  { front: "Equus", back: "Horse" },
  { front: "Flamma", back: "Flame" },
  { front: "Gladius", back: "Sword" },
  { front: "Homo", back: "Man" },
  { front: "Ignis", back: "Fire" },
  { front: "Lux", back: "Light" },
  { front: "Mare", back: "Sea" },
  { front: "Nox", back: "Night" },
  { front: "Pax", back: "Peace" },
  { front: "Rex", back: "King" },
  { front: "Terra", back: "Earth" },
  { front: "Uxor", back: "Wife" },
  { front: "Vita", back: "Life" },
];

interface FlashcardsState {
  cardsSeen: { front: string; back: string; score: number; }[];
  cardsRemaining: { front: string; back: string }[];
  showBack: boolean;
  isLoading: boolean;
}

type FlashcardsAction =
  | { type: 'LOAD_CARDS'; payload: { front: string; back: string }[] }
  | { type: 'SHOW_BACK' }
  | { type: 'HIDE_BACK' }
  | { type: 'SUBMIT_SCORE'; payload: number }
  | { type: 'NEXT_CARD'; payload: number };

const initialState: FlashcardsState = {
  cardsSeen: [],
  cardsRemaining: [],
  showBack : false,
  isLoading: false,
}

// reducer for flashcards state
function reducer(state: FlashcardsState, action: FlashcardsAction): FlashcardsState {
  switch (action.type) {
    case 'LOAD_CARDS':
      return { ...state, cardsSeen: [], cardsRemaining: action.payload, showBack: false };
    case 'SHOW_BACK':
      return { ...state, showBack: true };
    case 'HIDE_BACK':
      return { ...state, showBack: false };
    case 'SUBMIT_SCORE':
      return {
        ...state,
        cardsSeen: [...state.cardsSeen, { ...state.cardsRemaining[0], score: action.payload }],
        cardsRemaining: state.cardsRemaining.slice(1),
        showBack: false,
      };
    case 'NEXT_CARD':
      const [nextCard, ...remainingCards] = state.cardsRemaining;
      return {
        ...state,
        cardsSeen: [...state.cardsSeen, { ...nextCard, score: action.payload }],
        cardsRemaining: remainingCards,
        showBack: false,
      };
    default:
      return state;
  }
}

function Main() {
  // load a set of cards from server
  // bang through the cards
  // - show the front of the card
  // - wait for user to click or press space
  // - show the back of the card
  // - user presses 'soon' 'later' or 'good' (can also press 1 2 or 3)
  // - show the next card
  // when all cards are done, show the results. send the results to the server to get the next set
  // user presses space to start the next set
  const [state, dispatch] = useReducer<FlashcardsState, [FlashcardsAction]>(reducer, initialState);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        dispatch({ type: 'SHOW_BACK' });
      }
      if (state.showBack && (event.key === '1' || event.key === 'z' || event.key === 'ArrowLeft' || event.key === 'ArrowUp')) {
        event.preventDefault();
        dispatch({ type: 'SUBMIT_SCORE', payload: 0 });
      }
      if (state.showBack && (event.key === '2' || event.key === 'x')) {
        event.preventDefault();
        dispatch({ type: 'SUBMIT_SCORE', payload: 0.5 });
      }
      if (state.showBack && (event.key === '3' || event.key === 'c' || event.key === ' ' || event.key === 'ArrowRight' || event.key === 'ArrowDown')) {
        event.preventDefault();
        dispatch({ type: 'SUBMIT_SCORE', payload: 1 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }
  , [state.showBack]);
  useEffect(() => {
    if (state.cardsRemaining.length === 0) {
      dispatch({ type: 'LOAD_CARDS', payload: flashcards });
    }
  }
  , [state.cardsRemaining.length]);
  return (
    <div className="flex flex-col gap-[32px]">
      <div className="flex flex-col gap-[32px]">
        {state.cardsRemaining.length > 0 ? (
          <div>
            <div className="flex flex-col gap-[32px] min-w-[600px] min-h-[400px]">
            <div className="flex flex-col gap-[32px]">
              <h2 className="text-2xl font-bold">{state.cardsRemaining[0].front}</h2>
              {state.showBack ? (
                <div className="flex flex-col gap-[32px]">
                  <h3 className="text-xl font-bold">{state.cardsRemaining[0].back}</h3>
                  <div className="flex gap-[32px]">
                    <button 
                      onClick={() => dispatch({ type: 'SUBMIT_SCORE', payload: 1 })} 
                      className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                      Soon
                    </button>
                    <button 
                      onClick={() => dispatch({ type: 'SUBMIT_SCORE', payload: 2 })} 
                      className="bg-yellow-500 text-white px-4 py-2 rounded"
                    >
                      Later
                    </button>
                    <button 
                      onClick={() => dispatch({ type: 'SUBMIT_SCORE', payload: 3 })} 
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      Good
                    </button>
                  </div>
                </div>
              ) : 
              <div className="flex flex-col gap-[32px]">
                  <h3 className="text-xl font-bold">&nbsp;</h3>
                  <div className="flex gap-[32px]">
                <button 
                  onClick={() => dispatch({ type: 'SHOW_BACK' })} 
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Reveal
                </button>
                </div>
              </div>
              }
            </div>
          </div>
            <div className="flex flex-col gap-[16px]">
              <h3 className="text-xl font-bold">Flashcards:</h3>
              <table className="table-auto border-collapse border border-gray-400 w-full">
              <thead>
                <tr>
                <th className="border border-gray-400 px-4 py-2">Front</th>
                <th className="border border-gray-400 px-4 py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {state.cardsSeen.map((card, index) => (
                <tr key={`seen-${index}`}>
                  <td className="border border-gray-400 px-4 py-2">{card.front}</td>
                  <td className="border border-gray-400 px-4 py-2">{card.score}</td>
                </tr>
                ))}
                {state.cardsRemaining.map((card, index) => (
                <tr key={`remaining-${index}`}>
                  <td className="border border-gray-400 px-4 py-2">{card.front}</td>
                  <td className="border border-gray-400 px-4 py-2">-</td>
                </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        ) : (
          <h2 className="text-2xl font-bold">All done!</h2>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_20px] items-start justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <Main />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
