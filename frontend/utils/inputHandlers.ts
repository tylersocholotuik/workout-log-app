import { Dispatch, SetStateAction } from "react";

export const stripLeadingZeros = (value: string) =>
    value.replace(/^0+(?=\d)/, "");

interface InputChangeOptions {
    value: string;
    regex: RegExp;
    isInteger: boolean;
    minValue: number;
    maxValue: number;
    setter: Dispatch<SetStateAction<string>>;
}

// validates a numeric input's value against a regex (character-by-character
// format) and a parsed-value range/step check. If valid, calls setter with
// the raw string; otherwise the input is left unchanged (effectively
// rejecting the keystroke).
export const handleInputChange = ({
    value,
    regex,
    isInteger,
    minValue,
    maxValue,
    setter,
}: InputChangeOptions) => {
    const isValidFormat = regex.test(value);

    const parsedValue = isInteger ? parseInt(value) : parseFloat(value);

    const isInRange =
        !isNaN(parsedValue) && parsedValue >= minValue && parsedValue <= maxValue;
    
    const isValidStep = isInteger || parsedValue % 0.5 === 0;

    // allows partial input toward maxValue (e.g. "1" while typing "10") even
    // though it's below minValue on its own
    const isPartialMaxPrefix =
        !isInteger && value !== "" && maxValue.toString().startsWith(value);

    const isValidValue =
        value === "" || isPartialMaxPrefix || (isInRange && isValidStep);

    const isValid = isValidFormat && isValidValue;

    if (isValid) {
        setter(value);
    }
};

interface SanitizableInput {
    value: string;
    setter: Dispatch<SetStateAction<string>>;
    stripTrailingDecimal?: boolean;
    stripLeadingZero?: boolean;
}

// called on focus blur to clean up display formatting: trailing decimals
// and/or leading zeros for each input provided
export const sanitizeDisplayValues = (inputs: SanitizableInput[]) => {
    inputs.forEach(({ value, setter, stripTrailingDecimal, stripLeadingZero }) => {
        let sanitizedValue = value;

        if (stripTrailingDecimal && sanitizedValue.endsWith(".")) {
            sanitizedValue = sanitizedValue.slice(0, -1);
        }

        if (stripLeadingZero) {
            sanitizedValue = stripLeadingZeros(sanitizedValue);
        }

        if (sanitizedValue !== value) {
            setter(sanitizedValue);
        }
    });
};
