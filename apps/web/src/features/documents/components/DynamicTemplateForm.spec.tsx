import type { Template } from "@pratikar/types";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { DynamicTemplateForm } from "./DynamicTemplateForm";

const TEMPLATE = {
  id: "t1",
  title: "Rent Agreement",
  fieldSchema: [
    { key: "tenant", label: "Tenant", type: "text", required: true },
    { key: "rent", label: "Monthly rent", type: "number", required: true },
  ],
} as unknown as Template;

describe("DynamicTemplateForm", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  // Regression: Number("") is 0, so an emptied number box used to count as
  // answered and a document went out with a rent of 0.
  it("treats a cleared number box as unanswered, not as 0", () => {
    const onSubmit = jest.fn();
    render(
      <DynamicTemplateForm
        template={TEMPLATE}
        onSubmit={onSubmit}
        isSubmitting={false}
        initialValues={{ tenant: "A. Sen" }}
      />,
    );

    const rent = screen.getByLabelText(/Monthly rent/);
    fireEvent.change(rent, { target: { value: "18000" } });
    fireEvent.change(rent, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Generate document/ }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Monthly rent is required.")).toBeTruthy();
  });

  it("starts from answers handed over by the chat, with its notice", () => {
    const onSubmit = jest.fn();
    render(
      <DynamicTemplateForm
        template={TEMPLATE}
        onSubmit={onSubmit}
        isSubmitting={false}
        initialValues={{ tenant: "A. Sen", rent: 18000 }}
        notice={<p>Check these answers</p>}
      />,
    );

    expect(screen.getByText("Check these answers")).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>(/Tenant/).value).toBe(
      "A. Sen",
    );
    fireEvent.click(screen.getByRole("button", { name: /Generate document/ }));
    expect(onSubmit).toHaveBeenCalledWith({ tenant: "A. Sen", rent: 18000 });
  });
});
