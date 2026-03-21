/**
 * South African ID Validator and Extractor
 * SA ID Format: YYMMDD G SSS C A Z
 * - YYMMDD: Date of birth
 * - G: Gender (0-4 = Female, 5-9 = Male)
 * - SSS: Sequence number
 * - C: Citizenship (0 = SA Citizen, 1 = Permanent Resident)
 * - A: 8 or 9 (usually 8)
 * - Z: Checksum digit (Luhn algorithm)
 */

class SAIdValidator {
  /**
   * Validate SA ID number using Luhn algorithm
   */
  static validate(idNumber) {
    if (!idNumber || typeof idNumber !== 'string') {
      return { valid: false, error: 'ID number is required' };
    }

    // Remove any spaces or hyphens
    const cleanId = idNumber.replace(/[\s-]/g, '');

    // Check length
    if (cleanId.length !== 13) {
      return { valid: false, error: 'ID number must be 13 digits' };
    }

    // Check if all digits
    if (!/^\d{13}$/.test(cleanId)) {
      return { valid: false, error: 'ID number must contain only digits' };
    }

    // Validate date of birth
    const dobResult = this.extractDateOfBirth(cleanId);
    if (!dobResult.valid) {
      return { valid: false, error: dobResult.error };
    }

    // Validate citizenship digit
    const citizenshipDigit = parseInt(cleanId.charAt(10));
    if (citizenshipDigit !== 0 && citizenshipDigit !== 1) {
      return { valid: false, error: 'Invalid citizenship indicator' };
    }

    // Luhn algorithm validation
    if (!this.luhnCheck(cleanId)) {
      return { valid: false, error: 'Invalid ID number (checksum failed)' };
    }

    return { valid: true, idNumber: cleanId };
  }

  /**
   * Extract all information from SA ID
   */
  static extractAll(idNumber) {
    const validation = this.validate(idNumber);
    if (!validation.valid) {
      return validation;
    }

    const cleanId = validation.idNumber;

    return {
      valid: true,
      idNumber: cleanId,
      dateOfBirth: this.extractDateOfBirth(cleanId).dateOfBirth,
      gender: this.extractGender(cleanId),
      citizenship: this.extractCitizenship(cleanId),
      age: this.calculateAge(cleanId)
    };
  }

  /**
   * Extract date of birth from SA ID
   */
  static extractDateOfBirth(idNumber) {
    const yearPrefix = parseInt(idNumber.substring(0, 2));
    const month = parseInt(idNumber.substring(2, 4));
    const day = parseInt(idNumber.substring(4, 6));

    // Determine full year (assume born after 1920 for simplicity)
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100);
    const year = (yearPrefix > (currentYear % 100)) ? 
      ((currentCentury - 1) * 100 + yearPrefix) : 
      (currentCentury * 100 + yearPrefix);

    // Validate date
    const dateOfBirth = new Date(year, month - 1, day);
    
    if (isNaN(dateOfBirth.getTime())) {
      return { valid: false, error: 'Invalid date of birth in ID number' };
    }

    if (dateOfBirth.getDate() !== day || dateOfBirth.getMonth() !== month - 1) {
      return { valid: false, error: 'Invalid date of birth in ID number' };
    }

    // Check if date is in the future
    if (dateOfBirth > new Date()) {
      return { valid: false, error: 'Date of birth cannot be in the future' };
    }

    // Check if person is too old (over 120 years)
    const age = this.calculateAgeFromDate(dateOfBirth);
    if (age > 120) {
      return { valid: false, error: 'Invalid date of birth (age exceeds 120 years)' };
    }

    // Format date as YYYY-MM-DD using local date components (not UTC)
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return {
      valid: true,
      dateOfBirth: formattedDate,
      year,
      month,
      day
    };
  }

  /**
   * Extract gender from SA ID
   */
  static extractGender(idNumber) {
    const genderDigit = parseInt(idNumber.charAt(6));
    return genderDigit >= 5 ? 'Male' : 'Female';
  }

  /**
   * Extract citizenship from SA ID
   */
  static extractCitizenship(idNumber) {
    const citizenshipDigit = parseInt(idNumber.charAt(10));
    return citizenshipDigit === 0 ? 'South African Citizen' : 'Permanent Resident';
  }

  /**
   * Calculate age from ID number
   */
  static calculateAge(idNumber) {
    const dobResult = this.extractDateOfBirth(idNumber);
    if (!dobResult.valid) return null;
    return this.calculateAgeFromDate(new Date(dobResult.dateOfBirth));
  }

  /**
   * Calculate age from date
   */
  static calculateAgeFromDate(dateOfBirth) {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Luhn algorithm for checksum validation
   */
  static luhnCheck(idNumber) {
    let sum = 0;
    let isSecond = false;

    for (let i = idNumber.length - 2; i >= 0; i--) {
      let digit = parseInt(idNumber.charAt(i));

      if (isSecond) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isSecond = !isSecond;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(idNumber.charAt(idNumber.length - 1));
  }

  /**
   * Format ID number for display
   */
  static format(idNumber) {
    const cleanId = idNumber.replace(/[\s-]/g, '');
    if (cleanId.length !== 13) return idNumber;
    return `${cleanId.substring(0, 6)}-${cleanId.substring(6, 10)}-${cleanId.substring(10, 13)}`;
  }
}

export default SAIdValidator;
