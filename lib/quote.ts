export function calculateQuote(quoteFormula, formData) {
    if (!quoteFormula) return null;

    const {
      baseHourRate,
      baseAdditionalHourRate,
      baseDayRate,
      baseAdditionalDayRate,
      baseWeekRate,
      baseAdditionalWeekRate,
      baseFourWeekRate,
      ageDiscountRanges,
      licenseDiscounts,
    } = quoteFormula;

    const durationValue = Number.parseInt(formData.duration.split(" ")[0]);
    let basePrice = 0;

    if (formData.durationType === "Hours") {
      if (durationValue === 1) {
        basePrice = Number.parseFloat(baseHourRate);
      } else if (durationValue < 24) {
        basePrice = Number.parseFloat(baseHourRate) + (durationValue - 1) * Number.parseFloat(baseAdditionalHourRate);
      } else {
        // Convert to days if 24+ hours
        const days = Math.ceil(durationValue / 24);
        if (days === 1) {
          basePrice = Number.parseFloat(baseDayRate);
        } else {
          basePrice = Number.parseFloat(baseDayRate) + (days - 1) * Number.parseFloat(baseAdditionalDayRate);
        }
      }
    } else if (formData.durationType === "Days") {
      if (durationValue === 1) {
        basePrice = Number.parseFloat(baseDayRate);
      } else {
        basePrice = Number.parseFloat(baseDayRate) + (durationValue - 1) * Number.parseFloat(baseAdditionalDayRate);
      }
    } else if (formData.durationType === "Weeks") {
      if (durationValue === 4) {
        basePrice = Number.parseFloat(baseFourWeekRate);
      } else if (durationValue === 1) {
        basePrice = Number.parseFloat(baseWeekRate);
      } else {
        basePrice = Number.parseFloat(baseWeekRate) + (durationValue - 1) * Number.parseFloat(baseAdditionalWeekRate);
      }
    }


    // Age calculation
    const currentYear = new Date().getFullYear();
    const birthYear = Number.parseInt(formData.dateOfBirthYear);
    const age = currentYear - birthYear;

    // Age discount calculation
    let ageDiscountAmount = 0;
    if (ageDiscountRanges) {
      for (const range of ageDiscountRanges) {
        const minAge = Number.parseFloat(range.minAge);
        const maxAge = Number.parseFloat(range.maxAge);
        const multiplier = Number.parseFloat(range.multiplier);

        if (age >= minAge && age <= maxAge) {
          ageDiscountAmount = (age - 17) * multiplier;
          break;
        }
      }
      if (age > 80 && ageDiscountRanges.length > 0) {
        const lastRange = ageDiscountRanges[ageDiscountRanges.length - 1];
        ageDiscountAmount = (80 - 17) * Number.parseFloat(lastRange.multiplier);
      }
    }

    // License experience discount
    let licenseDiscountPercentage = 0;
    if (licenseDiscounts) {
        const licenseDiscount = licenseDiscounts.find((d) => d.range === formData.licenseHeld);
        if (licenseDiscount) {
            licenseDiscountPercentage = licenseDiscount.discount;
        }
    }

    // Calculate total
    const priceAfterAgeDiscount = basePrice - ageDiscountAmount;
    const licenseDiscountAmount = priceAfterAgeDiscount * (licenseDiscountPercentage / 100);
    const total = priceAfterAgeDiscount - licenseDiscountAmount;

    return {
      basePrice,
      ageDiscountAmount,
      licenseDiscountAmount,
      total: Math.max(total, 8.5), // Minimum premium of £8.50
      breakdown: {
        age,
        duration: `${durationValue} ${formData.durationType.toLowerCase()}`,
        licenseExperience: formData.licenseHeld,
      },
    };
}
