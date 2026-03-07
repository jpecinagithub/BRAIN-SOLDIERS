import React, { createContext, useContext, useState, useMemo } from 'react';
import { submitScore, getRanking, getPlayers } from '../api/api';

// 1. Crear el Contexto
const GameContext = createContext();

// 2. Crear el Hook personalizado para usar el Contexto
export const useGameContext = () => useContext(GameContext);

// 3. Crear el Provider
export const GameProvider = ({ children }) => {
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [globalError, setGlobalError] = useState(null);

  // Función para establecer el jugador (usado en Home.jsx, que no hemos visto, pero es necesario)
  const setPlayer = (playerName) => {
    setCurrentPlayer(playerName);
  };

  // Envolver las llamadas API para manejar errores globalmente si es necesario
  const submitPlayerScore = async (player, points, game) => {
    setGlobalError(null); // Limpiar error anterior
    try {
      const result = await submitScore(player, points, game);
      return result;
    } catch (error) {
      console.error("API Error submitting score:", error);
      setGlobalError("No se pudo enviar la puntuación. Revisa el servidor API.");
      return null;
    }
  };

  // Centralizar otras llamadas API si es necesario, por ahora solo score
  
  // El valor memoizado evita re-renders innecesarios
  const contextValue = useMemo(() => ({
    currentPlayer,
    setPlayer,
    submitPlayerScore,
    globalError,
    setGlobalError,
    getRanking, // Exponer otras funciones de API si son necesarias globalmente
    getPlayers
  }), [currentPlayer, globalError]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};