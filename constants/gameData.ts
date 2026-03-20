export interface LogicQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export const logicQuestions: LogicQuestion[] = [
  {
    question: "What comes next: 2, 6, 18, 54, ?",
    options: ["108", "162", "72", "148"],
    correctIndex: 1,
  },
  {
    question: "If all Bloops are Razzles, and all Razzles are Lazzles, then all Bloops are definitely Lazzles?",
    options: ["True", "False", "Cannot determine", "Sometimes"],
    correctIndex: 0,
  },
  {
    question: "Which number doesn't belong: 3, 5, 11, 14, 17, 23?",
    options: ["3", "14", "17", "23"],
    correctIndex: 1,
  },
  {
    question: "A is to D as 1 is to ?",
    options: ["3", "4", "5", "2"],
    correctIndex: 1,
  },
  {
    question: "If you rearrange 'CIFAIPC', you get the name of a:",
    options: ["City", "Animal", "Ocean", "Country"],
    correctIndex: 2,
  },
  {
    question: "What is 15% of 200?",
    options: ["25", "30", "35", "20"],
    correctIndex: 1,
  },
  {
    question: "Complete: 1, 1, 2, 3, 5, 8, ?",
    options: ["11", "12", "13", "10"],
    correctIndex: 2,
  },
  {
    question: "If 5 machines take 5 minutes to make 5 widgets, how many minutes for 100 machines to make 100 widgets?",
    options: ["100", "5", "20", "50"],
    correctIndex: 1,
  },
];

export function getRandomQuestion(): LogicQuestion {
  return logicQuestions[Math.floor(Math.random() * logicQuestions.length)];
}

export function generateMemorySequence(length: number): number[] {
  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(Math.floor(Math.random() * 10));
  }
  return sequence;
}
