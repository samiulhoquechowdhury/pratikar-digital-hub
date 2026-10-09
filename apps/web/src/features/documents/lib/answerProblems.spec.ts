import { describeAnswerProblems } from "./answerProblems";

describe("describeAnswerProblems", () => {
  it("lists each refused answer in plain words", () => {
    const error = new Error(
      `API error 400: ${JSON.stringify({
        message: "INVALID_ANSWERS",
        problems: [
          { key: "name", label: "Full name", problem: "missing" },
          { key: "rent", label: "Monthly rent", problem: "not-a-number" },
        ],
      })}`,
    );

    expect(describeAnswerProblems(error)).toBe(
      "Please check your answers: Full name is required; Monthly rent needs to be a number.",
    );
  });

  it.each([
    [new Error("API error 500: oops")],
    [new Error('API error 400: {"message":"SOMETHING_ELSE"}')],
    [new Error("API error 400: not json")],
    ["not an error"],
  ])("leaves anything else to the generic message (%p)", (error) => {
    expect(describeAnswerProblems(error)).toBeNull();
  });
});
