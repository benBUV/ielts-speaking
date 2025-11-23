export const downloadAudioBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const mergeAudioBlobs = async (blobs: Blob[]): Promise<Blob> => {
  if (blobs.length === 0) {
    throw new Error('No audio blobs to merge');
  }

  if (blobs.length === 1) {
    return blobs[0];
  }

  const audioContext = new AudioContext();
  const audioBuffers: AudioBuffer[] = [];

  for (const blob of blobs) {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBuffers.push(audioBuffer);
  }

  const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const numberOfChannels = audioBuffers[0].numberOfChannels;
  const sampleRate = audioBuffers[0].sampleRate;

  const mergedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);

  let offset = 0;
  for (const buffer of audioBuffers) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      mergedBuffer.getChannelData(channel).set(channelData, offset);
    }
    offset += buffer.length;
  }

  const offlineContext = new OfflineAudioContext(
    numberOfChannels,
    mergedBuffer.length,
    sampleRate
  );
  const source = offlineContext.createBufferSource();
  source.buffer = mergedBuffer;
  source.connect(offlineContext.destination);
  source.start();

  const renderedBuffer = await offlineContext.startRendering();

  const wavBlob = await audioBufferToWav(renderedBuffer);
  return wavBlob;
};

const audioBufferToWav = (buffer: AudioBuffer): Promise<Blob> => {
  return new Promise((resolve) => {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    const channelData: Float32Array[] = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
  });
};
