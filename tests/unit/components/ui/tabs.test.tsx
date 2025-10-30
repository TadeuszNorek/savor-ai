import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

describe("Tabs components", () => {
  describe("Tabs", () => {
    it("should render tabs root", () => {
      render(
        <Tabs data-testid="tabs">
          <div>Content</div>
        </Tabs>
      );
      const tabs = screen.getByTestId("tabs");
      expect(tabs).toBeInTheDocument();
    });

    it("should have data-slot attribute", () => {
      render(<Tabs data-testid="tabs">Content</Tabs>);
      const tabs = screen.getByTestId("tabs");
      expect(tabs).toHaveAttribute("data-slot", "tabs");
    });

    it("should accept custom className", () => {
      render(
        <Tabs className="custom-tabs" data-testid="tabs">
          Content
        </Tabs>
      );
      const tabs = screen.getByTestId("tabs");
      expect(tabs).toHaveClass("custom-tabs");
    });
  });

  describe("TabsList", () => {
    it("should render tabs list", () => {
      render(
        <Tabs>
          <TabsList data-testid="tabs-list">
            <div>Triggers</div>
          </TabsList>
        </Tabs>
      );
      const list = screen.getByTestId("tabs-list");
      expect(list).toBeInTheDocument();
    });

    it("should have data-slot attribute", () => {
      render(
        <Tabs>
          <TabsList data-testid="tabs-list">Content</TabsList>
        </Tabs>
      );
      const list = screen.getByTestId("tabs-list");
      expect(list).toHaveAttribute("data-slot", "tabs-list");
    });

    it("should accept custom className", () => {
      render(
        <Tabs>
          <TabsList className="custom-list" data-testid="tabs-list">
            Content
          </TabsList>
        </Tabs>
      );
      const list = screen.getByTestId("tabs-list");
      expect(list).toHaveClass("custom-list");
    });
  });

  describe("TabsTrigger", () => {
    it("should render tabs trigger", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toBeInTheDocument();
      expect(screen.getByText("Tab 1")).toBeInTheDocument();
    });

    it("should have data-slot attribute", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              Tab
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveAttribute("data-slot", "tabs-trigger");
    });

    it("should accept custom className", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger" data-testid="trigger">
              Tab
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveClass("custom-trigger");
    });

    it("should be disabled when disabled prop is true", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1" disabled data-testid="trigger">
              Tab
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toBeDisabled();
    });
  });

  describe("TabsContent", () => {
    it("should render tabs content", () => {
      render(
        <Tabs>
          <TabsContent value="tab1" data-testid="content">
            Content for tab 1
          </TabsContent>
        </Tabs>
      );
      const content = screen.getByTestId("content");
      expect(content).toBeInTheDocument();
    });

    it("should have data-slot attribute", () => {
      render(
        <Tabs>
          <TabsContent value="tab1" data-testid="content">
            Content
          </TabsContent>
        </Tabs>
      );
      const content = screen.getByTestId("content");
      expect(content).toHaveAttribute("data-slot", "tabs-content");
    });

    it("should accept custom className", () => {
      render(
        <Tabs>
          <TabsContent value="tab1" className="custom-content" data-testid="content">
            Content
          </TabsContent>
        </Tabs>
      );
      const content = screen.getByTestId("content");
      expect(content).toHaveClass("custom-content");
    });
  });

  describe("Tabs composition", () => {
    it("should render complete tabs with all components", () => {
      render(
        <Tabs defaultValue="tab1" data-testid="tabs">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1" data-testid="trigger1">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" data-testid="trigger2">
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" data-testid="content1">
            Content for Tab 1
          </TabsContent>
          <TabsContent value="tab2" data-testid="content2">
            Content for Tab 2
          </TabsContent>
        </Tabs>
      );

      expect(screen.getByTestId("tabs")).toBeInTheDocument();
      expect(screen.getByTestId("tabs-list")).toBeInTheDocument();
      expect(screen.getByTestId("trigger1")).toBeInTheDocument();
      expect(screen.getByTestId("trigger2")).toBeInTheDocument();
      expect(screen.getByText("Tab 1")).toBeInTheDocument();
      expect(screen.getByText("Tab 2")).toBeInTheDocument();
    });
  });
});
