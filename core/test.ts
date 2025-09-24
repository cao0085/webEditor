// TypeScript 測試檔案

function greetUser(name: string): string {
  return `Hello, ${name}! Welcome to TypeScript with Electron.`;
}

function calculateSum(a: number, b: number): number {
  console.log(`計算 ${a} + ${b}`);
  return a + b;
}

function testFunction(): void {
  console.log('=== TypeScript 測試開始 ===');

  const userName: string = 'Electron Developer';
  const greeting: string = greetUser(userName);
  console.log(greeting);

  const result: number = calculateSum(10, 25);
  console.log(`結果: ${result}`);

  const numbers: number[] = [1, 2, 3, 4, 5];
  const sum: number = numbers.reduce((acc, num) => acc + num, 0);
  console.log(`陣列總和: ${sum}`);

  console.log('=== TypeScript 測試完成 ===');
}

// 執行測試
testFunction();