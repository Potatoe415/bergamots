(function attachYatzyRandom(global) {
  function randomDieValue() {
    return getSecureRandomInt(1, 6);
  }

  function getSecureRandomInt(minInclusive, maxInclusive) {
    const min = Math.ceil(minInclusive);
    const max = Math.floor(maxInclusive);
    const range = max - min + 1;

    if (range <= 0) {
      throw new Error("Invalid random range.");
    }

    if (!global.crypto?.getRandomValues) {
      return Math.floor(Math.random() * range) + min;
    }

    const maxUint32 = 0xffffffff;
    const acceptanceLimit = maxUint32 - (maxUint32 % range);
    const bucket = new Uint32Array(1);

    do {
      global.crypto.getRandomValues(bucket);
    } while (bucket[0] >= acceptanceLimit);

    return min + (bucket[0] % range);
  }

  global.YATZY_RANDOM = {
    randomDieValue,
    getSecureRandomInt
  };
})(window);
