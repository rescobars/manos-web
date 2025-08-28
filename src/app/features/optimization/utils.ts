// Generar color verde que va de claro a oscuro según el número de parada
export const generateStopColor = (stopNumber: number, totalStops: number) => {
  // Verde claro al inicio (no tan extremo)
  const startGreen = [187, 247, 208]; // #BBF7D0 - verde claro suave
  
  // Verde medio-oscuro al final (no tan extremo)
  const endGreen = [34, 197, 94]; // #22C55E - verde medio
  
  // Calcular qué tan oscuro debe ser (0 = claro, 1 = oscuro)
  const darknessFactor = (stopNumber - 1) / Math.max(totalStops - 1, 1);
  
  // Interpolación lineal entre el color claro y oscuro
  const red = Math.round(startGreen[0] + (endGreen[0] - startGreen[0]) * darknessFactor);
  const green = Math.round(startGreen[1] + (endGreen[1] - startGreen[1]) * darknessFactor);
  const blue = Math.round(startGreen[2] + (endGreen[2] - startGreen[2]) * darknessFactor);
  
  return `rgb(${red}, ${green}, ${blue})`;
};

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
};

// Funciones auxiliares para crear marcadores
export function createNumberedMarker(stopNumber: number, color: string) {
  const el = document.createElement('div');
  el.className = 'numbered-marker';
  el.style.cssText = `
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: ${color};
    color: white;
    font-weight: bold;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  `;
  el.textContent = stopNumber.toString();
  return el;
}

export function createPickupMarker() {
  const el = document.createElement('div');
  el.className = 'pickup-marker';
  el.style.cssText = `
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #3B82F6;
    color: white;
    font-weight: bold;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  `;
  el.innerHTML = '🚚';
  return el;
}
