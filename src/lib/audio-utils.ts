/**
 * Audio utilities for PCM16 encoding/decoding
 * Used for XAI voice API communication
 */

/**
 * Convert Float32Array audio data to PCM16 base64 string
 */
export function float32ToPCM16Base64(float32Array: Float32Array): string {
  const pcm16 = new Int16Array(float32Array.length);
  
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to [-1, 1] and convert to 16-bit integer
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  
  // Convert to base64
  const uint8Array = new Uint8Array(pcm16.buffer);
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  
  return btoa(binary);
}

/**
 * Convert base64 PCM16 string to Float32Array for playback
 */
export function base64PCM16ToFloat32(base64: string): Float32Array {
  // Decode base64 to binary string
  const binary = atob(base64);
  const uint8Array = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    uint8Array[i] = binary.charCodeAt(i);
  }
  
  // Convert to Int16Array then to Float32Array
  const pcm16 = new Int16Array(uint8Array.buffer);
  const float32 = new Float32Array(pcm16.length);
  
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
  }
  
  return float32;
}
