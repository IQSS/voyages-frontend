import { isPartialDate } from "./properties"

export interface ValidationMessage {
  value: any
  message: string
  type: "Suggestion" | "Warning" | "Error"
}

export type PropertyValidation = (value: any) => ValidationMessage[]

export const nonNullValidation: PropertyValidation = (value: any) => {
  if (value === null || value === undefined || value === "") {
    return [
      {
        value,
        message: "Value must be non-null",
        type: "Error"
      }
    ]
  }
  return []
}

export const lengthValidation =
  (minLen: number, maxLen: number): PropertyValidation =>
  (value) => {
    if (value?.length === undefined) {
      return [
        {
          value,
          message: "Invalid value type",
          type: "Error"
        }
      ]
    }
    if (value.length < minLen) {
      return [
        {
          value,
          message: `Minimum length allowed is ${minLen}.`,
          type: "Error"
        }
      ]
    }
    if (value.length > maxLen) {
      return [
        {
          value,
          message: `Maximum length allowed is ${minLen}.`,
          type: "Error"
        }
      ]
    }
    return []
  }

export const rangeValidation =
  (minValue: number, maxValue: number): PropertyValidation =>
  (value: any) => {
    if (typeof value !== "number") {
      return [
        {
          value,
          message: "Expected a number",
          type: "Error"
        }
      ]
    }
    if (value < minValue) {
      return [
        {
          value,
          message: `Value smaller than ${minValue}`,
          type: "Error"
        }
      ]
    }
    if (value > maxValue) {
      return [
        {
          value,
          message: `Value larger than ${maxValue}`,
          type: "Error"
        }
      ]
    }
    return []
  }

export const combineValidations =
  (...validations: PropertyValidation[]): PropertyValidation =>
  (value: any) =>
    validations.flatMap((v) => v(value))

export const dateValidation =
  (allowPartial: boolean): PropertyValidation =>
  (value: any) => {
    if (!isPartialDate(value)) {
      return [
        {
          value,
          message: `Expected a ${allowPartial ? "partial " : ""} date`,
          type: "Error"
        }
      ]
    }
    if (!allowPartial && !value.month && !value.day) {
      return [
        {
          value,
          message: "The month and day values are required",
          type: "Error"
        }
      ]
    }
    if (!value.month && value.day) {
      return [
        {
          value,
          message: "The month value is required if a day is specified",
          type: "Error"
        }
      ]
    }
    // Check if the date is valid, e.g. 2024-02-30 should fail validation.
    const date = new Date(`${value.year}-${value.month ?? 1}-${value.day ?? 1}`)
    const valid = date instanceof Date && !isNaN(date.getDate())
    return valid
      ? []
      : [
          {
            value,
            message: "The date does not exist",
            type: "Error"
          }
        ]
  }

export const failedUnknown = (what: string, c: object) =>
  new Error(`Unknown ${what} type: ${JSON.stringify(c)}`)
