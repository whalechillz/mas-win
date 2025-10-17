import { useState, useCallback } from 'react';

interface CollapseState {
  fileUpload: boolean;
  annualGenerator: boolean;
  quickAdd: boolean;
  blogSync: boolean;
  template: boolean;
  originalContent: boolean;
}

const initialCollapseState: CollapseState = {
  fileUpload: true,
  annualGenerator: true,
  quickAdd: true,
  blogSync: true,
  template: true,
  originalContent: true
};

export const useSectionCollapse = () => {
  const [collapsedSections, setCollapsedSections] = useState<CollapseState>(initialCollapseState);

  const toggleSection = useCallback((section: keyof CollapseState) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const expandSection = useCallback((section: keyof CollapseState) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: false
    }));
  }, []);

  const collapseSection = useCallback((section: keyof CollapseState) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: true
    }));
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedSections({
      fileUpload: false,
      annualGenerator: false,
      quickAdd: false,
      blogSync: false,
      template: false,
      originalContent: false
    });
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedSections(initialCollapseState);
  }, []);

  return {
    collapsedSections,
    toggleSection,
    expandSection,
    collapseSection,
    expandAll,
    collapseAll
  };
};
