(function attachYatzyRobot(global) {
  function createEngine(options) {
    const categories = options.categories;
    const evaluateCategoryScore = options.evaluateCategoryScore;
    const calculateGrandTotal = options.calculateGrandTotal;
    const upperCategoryKeys = new Set(
      categories
        .filter((category) => category.type === "upper")
        .map((category) => category.key)
    );
    const categoryByKey = new Map(categories.map((category) => [category.key, category]));
    const rerollOutcomeDistributionCache = new Map();

    return {
      getDecision
    };

    function getDecision(scorecard, orderedValues, rollsRemaining) {
      if (orderedValues.some((value) => value === null)) {
        return { type: "roll" };
      }

      return computeBestRobotDecision(scorecard, orderedValues, rollsRemaining);
    }

    function computeBestRobotDecision(scorecard, orderedValues, rollsRemaining) {
      const memo = new Map();
      const bestScoreChoice = getBestRobotScoreChoice(scorecard, orderedValues);
      let bestAction = {
        type: "score",
        categoryKey: bestScoreChoice.categoryKey,
        value: bestScoreChoice.utility
      };

      if (rollsRemaining > 0) {
        getUniqueHoldOptions(orderedValues).forEach(({ lockMask, heldValues }) => {
          const rerollCount = 5 - heldValues.length;
          const expectedValue = getRerollOutcomeDistribution(rerollCount).reduce((sum, outcome) => {
            const nextValues = [...heldValues, ...outcome.values].sort((a, b) => a - b);
            return sum + (outcome.probability * getBestRobotStateValue(scorecard, nextValues, rollsRemaining - 1, memo));
          }, 0);

          if (expectedValue > bestAction.value + 0.0001) {
            bestAction = {
              type: "hold",
              lockMask,
              value: expectedValue
            };
          }
        });
      }

      return bestAction;
    }

    function getBestRobotStateValue(scorecard, sortedValues, rollsRemaining, memo) {
      const key = `${serializeScorecard(scorecard)}|${rollsRemaining}|${sortedValues.join("")}`;
      if (memo.has(key)) {
        return memo.get(key);
      }

      let bestValue = getBestRobotScoreChoice(scorecard, sortedValues).utility;

      if (rollsRemaining > 0) {
        getUniqueHoldOptions(sortedValues).forEach(({ heldValues }) => {
          const rerollCount = 5 - heldValues.length;
          const expectedValue = getRerollOutcomeDistribution(rerollCount).reduce((sum, outcome) => {
            const nextValues = [...heldValues, ...outcome.values].sort((a, b) => a - b);
            return sum + (outcome.probability * getBestRobotStateValue(scorecard, nextValues, rollsRemaining - 1, memo));
          }, 0);

          if (expectedValue > bestValue) {
            bestValue = expectedValue;
          }
        });
      }

      memo.set(key, bestValue);
      return bestValue;
    }

    function getBestRobotScoreChoice(scorecard, values) {
      const availableCategories = categories.filter((category) => scorecard[category.key] === null);
      if (availableCategories.length === 0) {
        return {
          categoryKey: categories[0]?.key || "ones",
          score: 0,
          utility: Number.NEGATIVE_INFINITY
        };
      }

      let bestChoice = {
        categoryKey: availableCategories[0].key,
        utility: Number.NEGATIVE_INFINITY
      };

      availableCategories.forEach((category) => {
        const score = evaluateCategoryScore(category.key, values);
        const utility = getRobotScoreUtility(scorecard, category.key, score);

        if (utility > bestChoice.utility) {
          bestChoice = {
            categoryKey: category.key,
            score,
            utility
          };
        }
      });

      return bestChoice;
    }

    function getRobotScoreUtility(scorecard, categoryKey, score) {
      const nextScorecard = {
        ...scorecard,
        [categoryKey]: score
      };

      let utility = calculateGrandTotal(nextScorecard) - calculateGrandTotal(scorecard);

      if (categoryKey === "min") {
        if (categoryByKey.has("max")) {
          utility += scorecard.max === null ? (30 - score) * 0.6 : Math.max(0, scorecard.max - score);
        }
      }

      if (categoryKey === "max") {
        if (categoryByKey.has("min")) {
          utility += scorecard.min === null ? score * 0.6 : Math.max(0, score - scorecard.min);
        }
      }

      if (upperCategoryKeys.has(categoryKey)) {
        utility += score * 0.2;
      }

      if (score === 0) {
        utility -= getZeroScorePenalty(categoryKey);
      }

      return utility;
    }

    function getZeroScorePenalty(categoryKey) {
      const category = categoryByKey.get(categoryKey);
      if (!category) {
        return 8;
      }

      if (category.scoreRule === "yatzy") {
        return 26;
      }
      if (category.scoreRule === "straight") {
        return 18;
      }
      if (category.scoreRule === "smallStraight") {
        return 16;
      }
      if (category.scoreRule === "fourKind") {
        return 16;
      }
      if (category.scoreRule === "threeKind") {
        return 12;
      }
      if (category.scoreRule === "fullHouse") {
        return 14;
      }
      if (category.key === "sixes") {
        return 12;
      }
      if (category.key === "fives") {
        return 10;
      }
      if (category.key === "max") {
        return 8;
      }
      if (category.key === "min") {
        return 6;
      }

      return 8;
    }

    function getRerollOutcomeDistribution(numDice) {
      if (rerollOutcomeDistributionCache.has(numDice)) {
        return rerollOutcomeDistributionCache.get(numDice);
      }

      const counts = new Map();
      const totalOutcomes = 6 ** numDice;

      function build(depth, values) {
        if (depth === numDice) {
          const key = [...values].sort((a, b) => a - b).join("");
          counts.set(key, (counts.get(key) || 0) + 1);
          return;
        }

        for (let value = 1; value <= 6; value += 1) {
          values.push(value);
          build(depth + 1, values);
          values.pop();
        }
      }

      build(0, []);

      const distribution = Array.from(counts.entries()).map(([key, count]) => ({
        values: key.split("").map(Number),
        probability: count / totalOutcomes
      }));

      rerollOutcomeDistributionCache.set(numDice, distribution);
      return distribution;
    }

    function getHeldValuesFromMask(values, lockMask) {
      return values.filter((_, index) => Boolean(lockMask & (1 << index)));
    }

    function getUniqueHoldOptions(values) {
      const uniqueOptions = new Map();

      for (let lockMask = 0; lockMask < 32; lockMask += 1) {
        const heldValues = getHeldValuesFromMask(values, lockMask);
        const signature = heldValues.slice().sort((a, b) => a - b).join("");

        if (!uniqueOptions.has(signature)) {
          uniqueOptions.set(signature, {
            lockMask,
            heldValues
          });
        }
      }

      return Array.from(uniqueOptions.values());
    }

    function serializeScorecard(scorecard) {
      return categories.map((category) => {
        const value = scorecard[category.key];
        return value === null ? "_" : String(value);
      }).join("|");
    }
  }

  global.YATZY_ROBOT = {
    createEngine
  };
}(window));
