'use client';

import Image from "next/image";
import {  useCallback, useEffect, useReducer, useRef } from "react";

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
  isLoaded: boolean;
}
type Card = {
  front: string;
  back: string;
};

type FlashcardsAction =
  | { type: 'LOAD_CARDS'; payload: Card[] }
  | { type: 'LOAD_MORE_CARDS'; payload: Card[] }
  | { type: 'SHOW_BACK' }
  | { type: 'HIDE_BACK' }
  | { type: 'SUBMIT_SCORE'; payload: number }
  | { type: 'LOAD_STATE'; payload: FlashcardsState }
  | { type: 'RESET_STATE' };

const initialState: FlashcardsState = {
  cardsSeen: [],
  cardsRemaining: [],
  showBack : false,
  isLoading: false,
  isLoaded: false,
}

// reducer for flashcards state
function reducer(state: FlashcardsState, action: FlashcardsAction): FlashcardsState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...state, ...action.payload, isLoaded: true };
    case 'LOAD_CARDS':
      return { ...state, cardsSeen: [], cardsRemaining: action.payload, showBack: false, isLoaded: true };
    case 'LOAD_MORE_CARDS':
      return { ...state, cardsRemaining: [...state.cardsRemaining, ...action.payload] };
    case 'SHOW_BACK':
      return { ...state, showBack: true };
    case 'HIDE_BACK':
      return { ...state, showBack: false };
    case 'SUBMIT_SCORE':
      if (state.cardsRemaining.length === 0) return state;

      const updatedCardsSeen = [...state.cardsSeen, { ...state.cardsRemaining[0], score: action.payload }];
      let updatedCardsRemaining = state.cardsRemaining.slice(1);

      while (updatedCardsSeen.length > 10) {
        const removedCard = updatedCardsSeen.shift();
        if (removedCard) {
          if (removedCard.score === 0) {
        updatedCardsRemaining = [removedCard, ...updatedCardsRemaining];
          } else if (removedCard.score === 0.5) {
        updatedCardsRemaining = [...updatedCardsRemaining, removedCard];
          }
        }
      }

      return {
        ...state,
        cardsSeen: updatedCardsSeen,
        cardsRemaining: updatedCardsRemaining,
        showBack: false,
      };
    case 'RESET_STATE':
      return initialState;
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
  const isFetchingMoreRef = useRef(false);

  const loadMoreCardsIfNeeded = useCallback(() => {
    if (isFetchingMoreRef.current) return;
    if (state.cardsRemaining.length > 5) return;
    isFetchingMoreRef.current = true;
    fetch('/api/flashcards', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      knownWords: [
        ...state.cardsSeen.map((card) => card.front),
        ...state.cardsRemaining.map((card) => card.front),
      ],
      }),
    })
      .then((response) => response.json())
      .then((data) => {
      dispatch({ type: 'LOAD_MORE_CARDS', payload: data });
      })
      .catch((error) => {
      console.error('Error loading cards:', error);
      })
      .finally(() => {
      isFetchingMoreRef.current = false;
      });
  }, [state.cardsRemaining.length]);

  useEffect(() => {
    const savedState = localStorage.getItem('flashcardsState');
    if (savedState) {
      dispatch({ type: 'LOAD_STATE', payload: JSON.parse(savedState) });
    } else {
      dispatch({ type: 'LOAD_CARDS', payload: flashcards });
    }
  }, []);

  useEffect(() => {
    if (!state.isLoaded) return;
    localStorage.setItem('flashcardsState', JSON.stringify(state));
  }, [state]);
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
      loadMoreCardsIfNeeded();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }
  , [state.showBack, loadMoreCardsIfNeeded]);

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
                      onClick={() => dispatch({ type: 'SUBMIT_SCORE', payload: 0 })} 
                      className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                      Soon
                    </button>
                    <button 
                      onClick={() => dispatch({ type: 'SUBMIT_SCORE', payload: 0.5 })} 
                      className="bg-yellow-500 text-white px-4 py-2 rounded"
                    >
                      Later
                    </button>
                    <button 
                      onClick={() => dispatch({ type: 'SUBMIT_SCORE', payload: 1 })} 
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
          </div>
        ) : (
          <div className="flex flex-col gap-[32px] min-w-[600px] min-h-[400px]">
          <div className="flex flex-col gap-[32px]">
          <h2 className="text-2xl font-bold">All done!</h2>
          <div className="flex gap-[32px]">
            <button
              onClick={() =>  dispatch({ type: 'LOAD_CARDS', payload: flashcards })}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Next Set
            </button>
          </div>
          </div>
          </div>
        )}
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
