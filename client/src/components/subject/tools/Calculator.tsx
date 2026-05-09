import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const handleNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay("0.");
      setWaitingForNewValue(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOperation = (op: string) => {
    const currentValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(currentValue);
    } else if (operation) {
      const result = calculate(prevValue, currentValue, operation);
      setDisplay(result.toString());
      setPrevValue(result);
    }

    setOperation(op);
    setWaitingForNewValue(true);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case "+":
        return prev + current;
      case "-":
        return prev - current;
      case "×":
        return prev * current;
      case "÷":
        return prev / current;
      case "%":
        return prev % current;
      case "^":
        return Math.pow(prev, current);
      default:
        return current;
    }
  };

  const handleEquals = () => {
    if (operation && prevValue !== null) {
      const currentValue = parseFloat(display);
      const result = calculate(prevValue, currentValue, operation);
      setDisplay(result.toString());
      setPrevValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPrevValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handleSpecialFunction = (func: string) => {
    const current = parseFloat(display);
    let result = 0;

    switch (func) {
      case "sqrt":
        result = Math.sqrt(current);
        break;
      case "sin":
        result = Math.sin((current * Math.PI) / 180);
        break;
      case "cos":
        result = Math.cos((current * Math.PI) / 180);
        break;
      case "tan":
        result = Math.tan((current * Math.PI) / 180);
        break;
      case "log":
        result = Math.log10(current);
        break;
      case "ln":
        result = Math.log(current);
        break;
      case "factorial":
        result = factorial(current);
        break;
    }

    setDisplay(result.toString());
    setWaitingForNewValue(true);
  };

  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  return (
    <div className="p-6 space-y-4">
      {/* Display */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 rounded-xl p-6 text-white">
        <div className="text-right">
          <p className="text-sm opacity-75 mb-2">
            {operation && prevValue !== null ? `${prevValue} ${operation}` : ""}
          </p>
          <p className="text-4xl font-bold font-mono break-words">{display}</p>
        </div>
      </div>

      {/* Special Functions */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          onClick={() => handleSpecialFunction("sqrt")}
          className="text-sm h-12"
        >
          √x
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSpecialFunction("sin")}
          className="text-sm h-12"
        >
          sin
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSpecialFunction("cos")}
          className="text-sm h-12"
        >
          cos
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSpecialFunction("tan")}
          className="text-sm h-12"
        >
          tan
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSpecialFunction("log")}
          className="text-sm h-12"
        >
          log
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSpecialFunction("ln")}
          className="text-sm h-12"
        >
          ln
        </Button>
      </div>

      {/* Main Calculator */}
      <div className="space-y-2">
        {/* Row 1: Clear, Backspace, Operations */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={handleClear}
            className="bg-red-500 hover:bg-red-600 text-white h-12 font-semibold"
          >
            C
          </Button>
          <Button
            onClick={handleBackspace}
            variant="outline"
            className="h-12"
          >
            <Delete className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => handleOperation("%")}
            variant="outline"
            className="h-12 font-semibold"
          >
            %
          </Button>
          <Button
            onClick={() => handleOperation("÷")}
            className="bg-blue-500 hover:bg-blue-600 text-white h-12 font-semibold"
          >
            ÷
          </Button>
        </div>

        {/* Rows 2-4: Numbers */}
        <div className="grid grid-cols-4 gap-2">
          {[7, 8, 9].map((num) => (
            <Button
              key={num}
              onClick={() => handleNumber(num.toString())}
              variant="outline"
              className="h-12 font-semibold text-lg"
            >
              {num}
            </Button>
          ))}
          <Button
            onClick={() => handleOperation("×")}
            className="bg-blue-500 hover:bg-blue-600 text-white h-12 font-semibold"
          >
            ×
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[4, 5, 6].map((num) => (
            <Button
              key={num}
              onClick={() => handleNumber(num.toString())}
              variant="outline"
              className="h-12 font-semibold text-lg"
            >
              {num}
            </Button>
          ))}
          <Button
            onClick={() => handleOperation("-")}
            className="bg-blue-500 hover:bg-blue-600 text-white h-12 font-semibold"
          >
            −
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3].map((num) => (
            <Button
              key={num}
              onClick={() => handleNumber(num.toString())}
              variant="outline"
              className="h-12 font-semibold text-lg"
            >
              {num}
            </Button>
          ))}
          <Button
            onClick={() => handleOperation("+")}
            className="bg-blue-500 hover:bg-blue-600 text-white h-12 font-semibold"
          >
            +
          </Button>
        </div>

        {/* Row 5: 0, Decimal, Power, Equals */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={() => handleNumber("0")}
            variant="outline"
            className="col-span-2 h-12 font-semibold text-lg"
          >
            0
          </Button>
          <Button
            onClick={handleDecimal}
            variant="outline"
            className="h-12 font-semibold text-lg"
          >
            .
          </Button>
          <Button
            onClick={() => handleOperation("^")}
            variant="outline"
            className="h-12 font-semibold"
          >
            x^y
          </Button>
        </div>

        {/* Equals Button */}
        <Button
          onClick={handleEquals}
          className="w-full bg-green-500 hover:bg-green-600 text-white h-12 font-semibold text-lg"
        >
          =
        </Button>
      </div>
    </div>
  );
}
