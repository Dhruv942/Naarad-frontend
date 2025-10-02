import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { usePreferences } from "../contexts/PreferencesContext";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import WhatsAppPreview from "../components/common/WhatsAppPreview";
import TagButton from "../components/common/TagButton";
import ProgressIndicator from "../components/common/ProgressIndicator";
import {
  ICONS,
  PagePath,
  EXAMPLE_NOTIFICATIONS,
  INTEREST_TAG_HIERARCHY,
  MainCategory,
  SubCategory,
  Tag as TagType,
  FollowUpQuestion as FollowUpQuestionType,
} from "../constants";
import {
  Alert,
  SampleMessage,
  CategoryFollowUpAnswers,
  SelectableTagCategoryKey as STCKType,
  CategorySpecificPreferences,
  AiFollowUpQuestion,
  FollowUpAnswer,
} from "../types";

const ValidationError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="my-3 p-3 bg-red-800/70 border border-red-600 text-red-100 rounded-lg shadow-md text-sm font-medium animate__animated animate__shakeX">
      <span className="font-bold mr-2">!</span> {message}
    </div>
  );
};

const InterestSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeAlert, setActiveAlert } = usePreferences();

  const [activeMainCategory, setActiveMainCategory] = useState<string | null>(
    null
  );
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(
    null
  );
  const [activePreviewMessage, setActivePreviewMessage] =
    useState<SampleMessage>(EXAMPLE_NOTIFICATIONS.DEFAULT);

  const [newCustomInterestTag, setNewCustomInterestTag] = useState("");
  const [newInstructionTag, setNewInstructionTag] = useState("");

  const [activeOtherInput, setActiveOtherInput] = useState<string | null>(null);
  const [otherSportNameInput, setOtherSportNameInput] = useState(
    activeAlert?.sports.otherSportName || ""
  );

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const mainCategoriesArray = Object.values(INTEREST_TAG_HIERARCHY);

  useEffect(() => {
    if (!activeAlert) {
      navigate(PagePath.DASHBOARD);
    }
  }, [activeAlert, navigate]);

  if (!activeAlert) {
    return <Navigate to={PagePath.DASHBOARD} replace />;
  }

  const handleUpdateAlert = (updater: (prevAlert: Alert) => Alert) => {
    setActiveAlert((prev) => (prev ? updater(prev) : null));
  };

  const clearValidation = () => {
    setValidationErrors({});
    setHasAttemptedSubmit(false);
  };

  const handleMainCategorySelect = (category: MainCategory) => {
    clearValidation();
    const isDeselecting = activeMainCategory === category.id;

    if (isDeselecting) {
      setActiveMainCategory(null);
      setActiveSubCategory(null);
      setActivePreviewMessage(EXAMPLE_NOTIFICATIONS.DEFAULT);
    } else {
      setActiveMainCategory(category.id);
      setActiveSubCategory(null);
      setActivePreviewMessage(
        EXAMPLE_NOTIFICATIONS[
          category.id.toUpperCase() as keyof typeof EXAMPLE_NOTIFICATIONS
        ] || EXAMPLE_NOTIFICATIONS.DEFAULT
      );

      // Auto-scroll on new selection
      setTimeout(() => {
        let nextSectionId: string | null = null;
        if (category.id === "custom") {
          nextSectionId = "custom-interest-section";
        } else if (
          category.subCategories &&
          category.subCategories.length > 0
        ) {
          nextSectionId = `sub-category-section-${category.id}`;
        } else if (category.tags && category.tags.length > 0) {
          nextSectionId = `tags-section-${category.id}`;
        }

        if (nextSectionId) {
          document
            .getElementById(nextSectionId)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }

    setNewInstructionTag("");
    setActiveOtherInput(null);
    if (category.id !== "sports") {
      setOtherSportNameInput("");
      handleUpdateAlert((prev) => ({
        ...prev,
        sports: { ...prev.sports, otherSportName: undefined },
      }));
    } else {
      setOtherSportNameInput(activeAlert.sports.otherSportName || "");
    }
  };

  const handleSubCategorySelect = (subCategory: SubCategory) => {
    clearValidation();
    const isDeselecting = activeSubCategory === subCategory.id;

    if (isDeselecting) {
      setActiveSubCategory(null);
      if (subCategory.id === "sports_other") {
        setOtherSportNameInput("");
        handleUpdateAlert((prev) => ({
          ...prev,
          sports: { ...prev.sports, otherSportName: undefined },
        }));
      }
    } else {
      setActiveSubCategory(subCategory.id);
      if (subCategory.id !== "sports_other") {
        setOtherSportNameInput("");
        handleUpdateAlert((prev) => ({
          ...prev,
          sports: { ...prev.sports, otherSportName: undefined },
        }));
      }
      // Auto-scroll on new selection
      setTimeout(() => {
        if (subCategory.tags && subCategory.tags.length > 0) {
          const nextSectionId = `tags-section-${subCategory.id}`;
          document
            .getElementById(nextSectionId)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  };

  const handleOtherSportNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    clearValidation();
    const newName = e.target.value;
    setOtherSportNameInput(newName);
    if (
      activeMainCategory === "sports" &&
      activeSubCategory === "sports_other"
    ) {
      handleUpdateAlert((prev) => ({
        ...prev,
        sports: { ...prev.sports, otherSportName: newName },
      }));
    }
  };

  const handleTagToggle = (categoryKey: STCKType, tagId: string) => {
    clearValidation();
    handleUpdateAlert((prev) => {
      const currentCategory = prev[categoryKey] as CategorySpecificPreferences;
      const currentTags = currentCategory.selectedTags || [];
      let newTags = currentTags.includes(tagId)
        ? currentTags.filter((t) => t !== tagId)
        : [...currentTags, tagId];

      if (categoryKey === "youtube") {
        const durationSubCategory =
          INTEREST_TAG_HIERARCHY.YOUTUBE.subCategories?.find(
            (sc) => sc.id === "youtube_duration"
          );
        if (
          durationSubCategory &&
          durationSubCategory.tags.some((t) => t.id === tagId)
        ) {
          const otherDurationTagIds = durationSubCategory.tags
            .map((t) => t.id)
            .filter((id) => id !== tagId);
          newTags = newTags.filter((t) => !otherDurationTagIds.includes(t));
        }
      }

      return {
        ...prev,
        [categoryKey]: {
          ...currentCategory,
          selectedTags: newTags,
        },
      };
    });
  };

  const handleFollowUpPredefinedTagToggle = (
    categoryKey: STCKType,
    questionId: string,
    tagLabel: string
  ) => {
    clearValidation();
    if (tagLabel === "No Preference") {
      const uniqueInputId = `${categoryKey}-${questionId}-other`;
      if (activeOtherInput === uniqueInputId) {
        setActiveOtherInput(null);
      }
    }
    handleUpdateAlert((prev) => {
      const currentCategory = prev[categoryKey] as CategorySpecificPreferences;
      const currentAnswers = currentCategory.followUpAnswers || {};
      const currentQuestionAnswer = currentAnswers[questionId] || {
        selectedPredefinedTags: [],
        customAnswerViaOther: "",
      };
      const currentlySelected = currentQuestionAnswer.selectedPredefinedTags;

      let newSelectedTags: string[];
      let newCustomAnswer = currentQuestionAnswer.customAnswerViaOther;

      if (tagLabel === "No Preference") {
        newSelectedTags = currentlySelected.includes("No Preference")
          ? []
          : ["No Preference"];
        if (newSelectedTags.length > 0) {
          newCustomAnswer = "";
        }
      } else {
        let intermediateTags = currentlySelected.filter(
          (t) => t !== "No Preference"
        );
        if (intermediateTags.includes(tagLabel)) {
          newSelectedTags = intermediateTags.filter((t) => t !== tagLabel);
        } else {
          newSelectedTags = [...intermediateTags, tagLabel];
        }
      }

      return {
        ...prev,
        [categoryKey]: {
          ...currentCategory,
          followUpAnswers: {
            ...currentAnswers,
            [questionId]: {
              ...currentQuestionAnswer,
              selectedPredefinedTags: newSelectedTags,
              customAnswerViaOther: newCustomAnswer,
            },
          },
        },
      };
    });
  };

  const handleFollowUpOtherTagToggle = (
    categoryKey: STCKType,
    questionId: string
  ) => {
    clearValidation();
    const uniqueInputId = `${categoryKey}-${questionId}-other`;
    const isCurrentlyActive = activeOtherInput === uniqueInputId;
    setActiveOtherInput(isCurrentlyActive ? null : uniqueInputId);

    handleUpdateAlert((prev) => {
      const currentCategory = prev[categoryKey] as CategorySpecificPreferences;
      const currentAnswers = currentCategory.followUpAnswers || {};
      const currentQuestionAnswer = currentAnswers[questionId] || {
        selectedPredefinedTags: [],
        customAnswerViaOther: "",
      };

      let newSelectedTags = currentQuestionAnswer.selectedPredefinedTags;
      let newCustomAnswer = currentQuestionAnswer.customAnswerViaOther;

      if (isCurrentlyActive) {
        newCustomAnswer = "";
      } else {
        newSelectedTags = newSelectedTags.filter((t) => t !== "No Preference");
      }

      return {
        ...prev,
        [categoryKey]: {
          ...currentCategory,
          followUpAnswers: {
            ...currentAnswers,
            [questionId]: {
              ...currentQuestionAnswer,
              selectedPredefinedTags: newSelectedTags,
              customAnswerViaOther: newCustomAnswer,
            },
          },
        },
      };
    });
  };

  const handleFollowUpOtherInputChange = (
    categoryKey: STCKType,
    questionId: string,
    value: string
  ) => {
    clearValidation();
    handleUpdateAlert((prev) => {
      const currentCategory = prev[categoryKey] as CategorySpecificPreferences;
      const currentAnswers = currentCategory.followUpAnswers || {};
      const currentQuestionAnswer = currentAnswers[questionId] || {
        selectedPredefinedTags: [],
        customAnswerViaOther: "",
      };
      const newSelectedTags =
        currentQuestionAnswer.selectedPredefinedTags.filter(
          (t) => t !== "No Preference"
        );

      return {
        ...prev,
        [categoryKey]: {
          ...currentCategory,
          followUpAnswers: {
            ...currentAnswers,
            [questionId]: {
              ...currentQuestionAnswer,
              customAnswerViaOther: value,
              selectedPredefinedTags: newSelectedTags,
            },
          },
        },
      };
    });
  };

  const isTagSelected = (categoryKey: STCKType, tagId: string): boolean => {
    const currentCategory = activeAlert[
      categoryKey
    ] as CategorySpecificPreferences;
    return (currentCategory?.selectedTags || []).includes(tagId);
  };

  const handleAddCustomInterestTag = () => {
    clearValidation();
    if (
      newCustomInterestTag.trim() &&
      !activeAlert.customInterestTags.includes(newCustomInterestTag.trim())
    ) {
      handleUpdateAlert((prev) => ({
        ...prev,
        customInterestTags: [
          ...prev.customInterestTags,
          newCustomInterestTag.trim(),
        ],
      }));
    }
    setNewCustomInterestTag("");
  };

  const handleRemoveCustomInterestTag = (tagToRemove: string) => {
    clearValidation();
    handleUpdateAlert((prev) => ({
      ...prev,
      customInterestTags: prev.customInterestTags.filter(
        (tag) => tag !== tagToRemove
      ),
    }));
  };

  const handlePopularCustomInterestTagClick = (tagLabel: string) => {
    clearValidation();
    if (!activeAlert.customInterestTags.includes(tagLabel)) {
      handleUpdateAlert((prev) => ({
        ...prev,
        customInterestTags: [...prev.customInterestTags, tagLabel],
      }));
    } else {
      handleRemoveCustomInterestTag(tagLabel);
    }
  };

  const handleAddInstructionTag = (categoryKey: STCKType) => {
    clearValidation();
    console.log(
      "🔍 Adding custom input:",
      newInstructionTag,
      "to category:",
      categoryKey
    );
    if (newInstructionTag.trim()) {
      handleUpdateAlert((prev) => {
        const currentCategory = prev[categoryKey] as CategorySpecificPreferences;
        const currentCustomInput = currentCategory.customInput || '';
        const newCustomInput = currentCustomInput
          ? `${currentCustomInput}, ${newInstructionTag.trim()}`
          : newInstructionTag.trim();

        console.log("🔍 Current custom input:", currentCustomInput);
        console.log("🔍 New custom input:", newCustomInput);

        const updated = {
          ...prev,
          [categoryKey]: {
            ...currentCategory,
            customInput: newCustomInput,
          },
        };
        console.log("🔍 Updated alert state:", updated);
        return updated;
      });
    }
    setNewInstructionTag("");
  };

  const handleRemoveInstructionTag = (
    categoryKey: STCKType,
    tagToRemove: string
  ) => {
    clearValidation();
    handleUpdateAlert((prev) => {
      const currentCategory = prev[categoryKey] as CategorySpecificPreferences;
      return {
        ...prev,
        [categoryKey]: {
          ...currentCategory,
          instructionTags: (currentCategory.instructionTags || []).filter(
            (tag) => tag !== tagToRemove
          ),
        },
      };
    });
  };

  const handlePopularInstructionTagClick = (
    categoryKey: STCKType,
    tagLabel: string
  ) => {
    clearValidation();
    handleUpdateAlert((prev) => {
      const currentCategory = prev[categoryKey] as CategorySpecificPreferences;
      const currentInstructionTags = currentCategory.instructionTags || [];
      if (!currentInstructionTags.includes(tagLabel)) {
        return {
          ...prev,
          [categoryKey]: {
            ...currentCategory,
            instructionTags: [...currentInstructionTags, tagLabel],
          },
        };
      } else {
        return {
          ...prev,
          [categoryKey]: {
            ...currentCategory,
            instructionTags: currentInstructionTags.filter(
              (t) => t !== tagLabel
            ),
          },
        };
      }
    });
  };

  const validateSelections = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const mainCatData =
      mainCategoriesArray.find((cat) => cat.id === activeMainCategory) || null;

    if (!activeMainCategory || !mainCatData) {
      errors["main-category-section"] =
        "Please select at least one broad category to continue.";
      return errors; // Early return as subsequent checks depend on this
    }

    if (mainCatData.id === "custom") {
      const hasCustomTags = activeAlert.customInterestTags?.length > 0;
      if (!hasCustomTags) {
        errors["custom-interest-section"] =
          "For the 'Custom' category, please add at least one interest tag.";
      }
    } else {
      const hasSubCats =
        mainCatData.subCategories && mainCatData.subCategories.length > 0;

      if (hasSubCats && !activeSubCategory) {
        errors[`sub-category-section-${mainCatData.id}`] =
          `For ${mainCatData.label}, please select a specific sub-category.`;
      }

      const catKey = mainCatData.id as STCKType;
      const categoryPrefs = activeAlert[catKey];
      const hasSelectedTags = categoryPrefs?.selectedTags?.length > 0;

      const isSports = mainCatData.id === "sports";
      const isOtherSportSelected =
        isSports && activeSubCategory === "sports_other";
      const otherSportNameIsSet =
        isSports && !!activeAlert.sports.otherSportName?.trim();

      const tagsSectionId = `tags-section-${activeSubCategory || mainCatData.id}`;

      if (activeSubCategory || !hasSubCats) {
        if (isOtherSportSelected && !otherSportNameIsSet) {
          errors["other-sport-input-section"] =
            `Please specify the name of the 'Other Sport'.`;
        } else if (!isOtherSportSelected && !hasSelectedTags) {
          errors[tagsSectionId] =
            `Please select at least one interest tag for ${currentSubCategoryData?.label || mainCatData.label}.`;
        }
      }
    }

    return errors;
  };

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    const errors = validateSelections();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErrorId = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorId);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      try {
        // Prepare data for API
        const mainCatData = mainCategoriesArray.find(
          (cat) => cat.id === activeMainCategory
        );
        const categoryKey = activeMainCategory as STCKType;
        const categoryPrefs = activeAlert[
          categoryKey
        ] as CategorySpecificPreferences;

        console.log("🔍 DEBUG - activeMainCategory:", activeMainCategory);
        console.log("🔍 DEBUG - categoryKey:", categoryKey);
        console.log("🔍 DEBUG - categoryPrefs:", categoryPrefs);
        console.log("🔍 DEBUG - Full activeAlert:", activeAlert);

        // Map frontend category IDs to backend enum values
        const categoryMapping: Record<string, string> = {
          sports: "Sports",
          news: "News",
          moviesTV: "Movies",
          movies: "Movies",
          youtube: "YouTube",
          custom: "Custom_Input",
        };

        // Get sub-categories
        const subCategories: string[] = [];
        if (activeSubCategory) {
          const subCatData = mainCatData?.subCategories?.find(
            (sc) => sc.id === activeSubCategory
          );
          if (subCatData) {
            subCategories.push(subCatData.label);
          }
        }

        // Get followup questions (selected predefined tags and custom answers from follow-up section)
        const followupQuestions: string[] = [];
        if (categoryPrefs?.followUpAnswers) {
          Object.values(categoryPrefs.followUpAnswers).forEach(
            (answer: FollowUpAnswer) => {
              if (
                answer.selectedPredefinedTags &&
                answer.selectedPredefinedTags.length > 0
              ) {
                followupQuestions.push(...answer.selectedPredefinedTags);
              }
              if (
                answer.customAnswerViaOther &&
                answer.customAnswerViaOther.trim()
              ) {
                followupQuestions.push(answer.customAnswerViaOther.trim());
              }
            }
          );
        }

        // Get custom question (user's manual custom input only, ignore instruction tags)
        // Also include any text currently in the input field (not yet added via button)
        let customQuestion = categoryPrefs?.customInput || "";

        // If user typed something in input field but didn't click Add, include it
        if (newInstructionTag.trim()) {
          customQuestion = customQuestion
            ? `${customQuestion}, ${newInstructionTag.trim()}`
            : newInstructionTag.trim();
        }

        // Get user_id from localStorage
        const userId = localStorage.getItem("user_id") || "";

        const payload = {
          main_category:
            categoryMapping[activeMainCategory || ""] || "Custom_Input",
          sub_categories: subCategories,
          followup_questions: followupQuestions,
          custom_question: customQuestion,
          user_id: userId,
        };

        console.log("🔍 DEBUG - Sending payload:", payload);
        console.log("🔍 DEBUG - Instruction Tags:", categoryPrefs?.instructionTags);
        console.log("🔍 DEBUG - Custom Input:", categoryPrefs?.customInput);
        console.log("🔍 DEBUG - Custom Question (sent to backend):", customQuestion);

        const response = await fetch("http://3.107.72.54:8000/alerts/alerts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error Response:", response.status, errorData);
          throw new Error(
            `Failed to save alert: ${response.status} ${JSON.stringify(errorData)}`
          );
        }

        const data = await response.json();
        console.log("Alert saved successfully:", data);

        navigate(PagePath.TUNING);
      } catch (error) {
        console.error("Error saving alert:", error);
        setValidationErrors({
          "main-category-section": "Failed to save alert. Please try again.",
        });
      }
    }
  };

  const currentMainCategoryData = activeMainCategory
    ? mainCategoriesArray.find((cat) => cat.id === activeMainCategory) || null
    : null;
  const currentSubCategoryData =
    currentMainCategoryData && activeSubCategory
      ? currentMainCategoryData.subCategories?.find(
          (sc) => sc.id === activeSubCategory
        ) || null
      : null;

  const showFollowUpQuestions =
    currentMainCategoryData?.followUpQuestions?.length > 0 &&
    (!currentMainCategoryData.subCategories ||
      (currentMainCategoryData.subCategories.length > 0 &&
        !!activeSubCategory));

  const showFollowUpPrompt =
    currentMainCategoryData?.followUpQuestions?.length > 0 &&
    currentMainCategoryData.subCategories?.length > 0 &&
    !activeSubCategory;

  const renderActiveTagsList = (
    tags: string[],
    onRemove: (tag: string) => void,
    categoryColor: string
  ) => (
    <div className="flex flex-wrap gap-2 mt-3">
      {tags.map((tag) => (
        <div
          key={tag}
          className={`flex items-center bg-${categoryColor}/20 text-${categoryColor} text-xs font-medium px-3 py-1.5 rounded-full shadow-sm border border-${categoryColor}/30`}
        >
          <span>{tag}</span>
          <button
            onClick={() => onRemove(tag)}
            className={`ml-2 text-${categoryColor}/70 hover:text-${categoryColor}`}
            aria-label={`Remove tag ${tag}`}
          >
            {ICONS.TRASH}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/95 via-secondary to-gray-900 text-white page-fade-enter">
      <div className="max-w-7xl mx-auto bg-white/5 backdrop-blur-xl shadow-2xl rounded-2xl p-4 sm:p-6 md:p-10 border border-white/10 pb-36 lg:pb-10">
        <ProgressIndicator
          currentStep={1}
          steps={["Select Interests", "Fine-Tune Feed", "Set Cadence"]}
        />

        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Tailor Your Alert:{" "}
            <span className="text-primary">{activeAlert.name}</span>
          </h1>
          <p className="text-base sm:text-lg text-primary-lighter/80 mt-4 max-w-3xl mx-auto">
            Select interests for this alert. The more specific you are, the
            better!
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="flex-grow lg:w-2/3 space-y-10">
            {/* --- Section 1: Broad Categories --- */}
            <section id="main-category-section">
              <h2 className="text-2xl font-semibold text-primary-lighter mb-6">
                1. Choose Broad Categories:
              </h2>
              <ValidationError
                message={validationErrors["main-category-section"]}
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {mainCategoriesArray.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleMainCategorySelect(category)}
                    className={`p-5 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 focus:outline-none focus:ring-4 
                      ${
                        activeMainCategory === category.id
                          ? `bg-${category.color} text-${category.textColor} ring-4 ring-white/90 scale-105 shadow-xl`
                          : `bg-${category.color}/60 text-white hover:bg-${category.color}/80 focus:ring-${category.color}/50 focus:ring-offset-secondary/30`
                      }
                    `}
                    aria-pressed={activeMainCategory === category.id}
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <span className="text-4xl md:text-5xl">
                        {category.icon}
                      </span>
                      <span className="text-md md:text-lg font-semibold tracking-wide">
                        {category.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* --- Section 2: Details --- */}
            {currentMainCategoryData && (
              <section
                className={`p-6 bg-white/10 rounded-xl shadow-lg transition-all duration-500 ease-in-out ${activeMainCategory ? "opacity-100 max-h-[9000px]" : "opacity-0 max-h-0 overflow-hidden"}`}
              >
                {currentMainCategoryData.id !== "custom" ? (
                  <>
                    <h3 className="text-2xl font-semibold text-primary-lighter mb-6">
                      2. Refine{" "}
                      <span
                        className={`font-bold text-${currentMainCategoryData.color}`}
                      >
                        {currentMainCategoryData.label}
                      </span>{" "}
                      Details:
                    </h3>

                    {currentMainCategoryData.subCategories &&
                      currentMainCategoryData.subCategories.length > 0 && (
                        <div
                          className="space-y-4 mb-6"
                          id={`sub-category-section-${currentMainCategoryData.id}`}
                        >
                          <label className="block text-md font-medium text-primary-lighter/90 mb-2">
                            Select sub-categories:
                          </label>
                          <ValidationError
                            message={
                              validationErrors[
                                `sub-category-section-${currentMainCategoryData.id}`
                              ]
                            }
                          />
                          <div className="flex flex-wrap gap-3">
                            {currentMainCategoryData.subCategories.map(
                              (subCat) => (
                                <TagButton
                                  key={subCat.id}
                                  label={subCat.label}
                                  icon={subCat.icon || ICONS.TAG}
                                  isSelected={activeSubCategory === subCat.id}
                                  onClick={() =>
                                    handleSubCategorySelect(subCat)
                                  }
                                  color={`bg-${currentMainCategoryData.color}/20 hover:bg-${currentMainCategoryData.color}/40`}
                                  textColor="text-white/90"
                                  selectedColor={`bg-${currentMainCategoryData.color}`}
                                  selectedTextColor={`text-${currentMainCategoryData.textColor}`}
                                  size="md"
                                />
                              )
                            )}
                          </div>
                          <div id="other-sport-input-section">
                            {activeMainCategory === "sports" &&
                              activeSubCategory === "sports_other" && (
                                <>
                                  <ValidationError
                                    message={
                                      validationErrors[
                                        "other-sport-input-section"
                                      ]
                                    }
                                  />
                                  <Input
                                    id="other-sport-name"
                                    label="Specify 'Other Sport' Name:"
                                    placeholder="e.g., Chess, Surfing, Archery"
                                    value={otherSportNameInput}
                                    onChange={handleOtherSportNameChange}
                                    inputClassName="mt-2 bg-white/5 placeholder-gray-400/70 text-white border-white/20 focus:border-primary-lightest text-sm py-2"
                                    labelClassName="!text-primary-lighter/80 !font-medium !text-sm"
                                  />
                                </>
                              )}
                          </div>
                        </div>
                      )}
                    <div
                      id={`tags-section-${activeSubCategory || currentMainCategoryData?.id}`}
                    >
                      {(currentSubCategoryData &&
                        currentSubCategoryData.tags.length > 0) ||
                      (currentMainCategoryData.tags &&
                        currentMainCategoryData.tags.length > 0 &&
                        !currentMainCategoryData.subCategories) ? (
                        <div className="space-y-4">
                          <label className="block text-md font-medium text-primary-lighter/90 mb-2">
                            {currentSubCategoryData
                              ? `Popular tags for ${currentSubCategoryData.label}:`
                              : `Popular tags for ${currentMainCategoryData.label}:`}
                          </label>
                          <ValidationError
                            message={
                              validationErrors[
                                `tags-section-${activeSubCategory || currentMainCategoryData.id}`
                              ]
                            }
                          />
                          <div className="flex flex-wrap gap-3">
                            {(
                              currentSubCategoryData?.tags ||
                              currentMainCategoryData.tags ||
                              []
                            ).map((tag: TagType) => (
                              <TagButton
                                key={tag.id}
                                label={tag.label}
                                icon={tag.icon}
                                isSelected={isTagSelected(
                                  currentMainCategoryData.id as STCKType,
                                  tag.id
                                )}
                                onClick={() =>
                                  handleTagToggle(
                                    currentMainCategoryData.id as STCKType,
                                    tag.id
                                  )
                                }
                                color="bg-gray-600/50 hover:bg-gray-600/70"
                                textColor="text-gray-100"
                                selectedColor={`bg-${currentMainCategoryData.color}`}
                                selectedTextColor={`text-${currentMainCategoryData.textColor}`}
                                size="md"
                              />
                            ))}
                          </div>
                        </div>
                      ) : activeSubCategory &&
                        (!currentSubCategoryData ||
                          currentSubCategoryData.tags.length === 0) &&
                        activeSubCategory !== "sports_other" ? (
                        <p className="text-primary-lighter/70 italic">
                          No specific tags for {currentSubCategoryData?.label}.
                        </p>
                      ) : null}
                    </div>
                    {showFollowUpQuestions && (
                      <div className="mt-8 pt-6 border-t border-white/10">
                        <h3 className="text-xl font-semibold text-primary-lighter mb-2 flex items-start">
                          <span
                            className={`text-${currentMainCategoryData.color} mr-3 text-2xl flex-shrink-0`}
                          >
                            {ICONS.LIGHTBULB}
                          </span>
                          <span className="leading-tight">
                            Fixed Follow-Up Questions for{" "}
                            <span
                              className={`font-bold text-${currentMainCategoryData.color}`}
                            >
                              {currentMainCategoryData.label}
                            </span>
                            :
                          </span>
                        </h3>
                        <p className="text-sm text-primary-lighter/80 mb-6 ml-8">
                          {currentMainCategoryData.followUpHelperText ||
                            `Answer a few questions to fine-tune your ${currentMainCategoryData.label} updates.`}
                        </p>
                        <div className="space-y-8 ml-8">
                          {currentMainCategoryData.followUpQuestions.map(
                            (question: FollowUpQuestionType) => {
                              const catKey =
                                currentMainCategoryData.id as STCKType;
                              const currentAnswer = activeAlert[catKey]
                                ?.followUpAnswers?.[question.id] || {
                                selectedPredefinedTags: [],
                                customAnswerViaOther: "",
                              };
                              const otherInputId = `${catKey}-${question.id}-other`;
                              const isOtherSelected =
                                activeOtherInput === otherInputId;

                              let dynamicPredefinedTags =
                                question.predefinedAnswerTags || [];
                              if (
                                catKey === "sports" &&
                                currentSubCategoryData
                              ) {
                                if (
                                  question.id === "favTeam" &&
                                  currentSubCategoryData.popularTeams
                                ) {
                                  dynamicPredefinedTags =
                                    currentSubCategoryData.popularTeams;
                                } else if (
                                  question.id === "favPlayer" &&
                                  currentSubCategoryData.popularPlayers
                                ) {
                                  dynamicPredefinedTags =
                                    currentSubCategoryData.popularPlayers;
                                }
                              }
                              if (
                                catKey === "sports" &&
                                (activeSubCategory === "sports_other" ||
                                  !currentSubCategoryData ||
                                  (question.id === "favTeam" &&
                                    !currentSubCategoryData.popularTeams) ||
                                  (question.id === "favPlayer" &&
                                    !currentSubCategoryData.popularPlayers))
                              ) {
                                dynamicPredefinedTags =
                                  question.predefinedAnswerTags?.filter(
                                    (tag) =>
                                      !tag.id.startsWith("favTeam_") &&
                                      !tag.id.startsWith("favPlayer_")
                                  ) || [];
                              }

                              const noPreferenceTag: TagType = {
                                id: `${question.id}_nopref`,
                                label: "No Preference",
                              };
                              const allDisplayTags = [
                                ...dynamicPredefinedTags,
                                noPreferenceTag,
                              ];

                              return (
                                <div key={question.id}>
                                  <label className="block text-md font-medium text-primary-lighter/90 mb-3">
                                    {question.text}
                                  </label>
                                  <div className="flex flex-wrap gap-3">
                                    {allDisplayTags.map((tag) => (
                                      <TagButton
                                        key={tag.id}
                                        label={tag.label}
                                        icon={
                                          tag.label === "No Preference"
                                            ? "🤷"
                                            : tag.icon
                                        }
                                        isSelected={currentAnswer.selectedPredefinedTags.includes(
                                          tag.label
                                        )}
                                        onClick={() =>
                                          handleFollowUpPredefinedTagToggle(
                                            catKey,
                                            question.id,
                                            tag.label
                                          )
                                        }
                                        color="bg-gray-600/50 hover:bg-gray-600/70"
                                        textColor="text-gray-100"
                                        selectedColor={`bg-${currentMainCategoryData.color}`}
                                        selectedTextColor={`text-${currentMainCategoryData.textColor}`}
                                      />
                                    ))}
                                    {question.hasOtherOption && (
                                      <TagButton
                                        label="Other (Specify)"
                                        icon={ICONS.OTHER}
                                        isSelected={isOtherSelected}
                                        onClick={() =>
                                          handleFollowUpOtherTagToggle(
                                            catKey,
                                            question.id
                                          )
                                        }
                                        color="bg-gray-500/50 hover:bg-gray-500/70"
                                        textColor="text-gray-100"
                                        selectedColor={`bg-${currentMainCategoryData.color}/70`}
                                        selectedTextColor={`text-${currentMainCategoryData.textColor}`}
                                      />
                                    )}
                                  </div>
                                  {isOtherSelected &&
                                    question.hasOtherOption && (
                                      <Input
                                        id={otherInputId}
                                        placeholder="Please specify your answer"
                                        value={
                                          currentAnswer.customAnswerViaOther ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleFollowUpOtherInputChange(
                                            catKey,
                                            question.id,
                                            e.target.value
                                          )
                                        }
                                        inputClassName="mt-3 bg-white/5 placeholder-gray-400/70 text-white border-white/20 focus:border-primary-lightest text-sm py-2"
                                      />
                                    )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                    {showFollowUpPrompt && (
                      <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 animate-pulse">
                          <p className="text-primary-lighter/70 italic">
                            <span className="text-xl mr-2">
                              {ICONS.LIGHTBULB}
                            </span>
                            Select a sub-category above to unlock more
                            personalization questions.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/10">
                      <h3 className="text-xl font-semibold text-primary-lighter/90 mb-3 flex items-start">
                        <span
                          className={`mr-3 text-2xl text-${currentMainCategoryData.color} flex-shrink-0`}
                        >
                          {ICONS.SETTINGS}
                        </span>
                        <span className="leading-tight">
                          Specific Instructions for{" "}
                          <span
                            className={`font-bold text-${currentMainCategoryData.color}`}
                          >
                            {currentMainCategoryData.label}
                          </span>{" "}
                          (as Tags):
                        </span>
                      </h3>
                      {currentMainCategoryData.popularInstructionTags &&
                        currentMainCategoryData.popularInstructionTags.length >
                          0 && (
                          <>
                            <p className="text-sm text-primary-lighter/70 mb-3 ml-8">
                              Suggested instructions (tap to add/remove):
                            </p>
                            <div className="flex flex-wrap gap-3 mb-5 ml-8">
                              {currentMainCategoryData.popularInstructionTags.map(
                                (tag) => (
                                  <TagButton
                                    key={tag.id}
                                    label={tag.label}
                                    icon={tag.icon || ICONS.TAG}
                                    isSelected={(
                                      activeAlert[
                                        currentMainCategoryData.id as STCKType
                                      ]?.instructionTags || []
                                    ).includes(tag.label)}
                                    onClick={() =>
                                      handlePopularInstructionTagClick(
                                        currentMainCategoryData.id as STCKType,
                                        tag.label
                                      )
                                    }
                                    color="bg-gray-600/50 hover:bg-gray-600/70"
                                    textColor="text-gray-100"
                                    selectedColor={`bg-${currentMainCategoryData.color}`}
                                    selectedTextColor={`text-${currentMainCategoryData.textColor}`}
                                  />
                                )
                              )}
                            </div>
                          </>
                        )}
                      <p className="text-sm text-primary-lighter/70 mb-2 ml-8">
                        Your custom instructions:
                      </p>
                      <div className="flex items-center gap-3 mb-3 ml-8 bg-white/10 p-3 rounded-lg border border-white/15 shadow-sm">
                        <Input
                          id={`new-instruction-tag-${currentMainCategoryData.id}`}
                          placeholder="Type custom instruction and press Add"
                          value={newInstructionTag}
                          onChange={(e) => setNewInstructionTag(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            handleAddInstructionTag(
                              currentMainCategoryData.id as STCKType
                            )
                          }
                          inputClassName="!bg-transparent placeholder-gray-400/70 text-white !border-none focus:!ring-0 !py-2.5"
                          className="flex-grow !mb-0"
                        />
                        <Button
                          onClick={() => {
                            console.log('🔍 BUTTON CLICKED! Current input value:', newInstructionTag);
                            handleAddInstructionTag(
                              currentMainCategoryData.id as STCKType
                            );
                          }}
                          size="md"
                          variant="outline"
                          className={`border-${currentMainCategoryData.color}/70 text-${currentMainCategoryData.color} hover:bg-${currentMainCategoryData.color}/20 !px-4 !py-2.5 shadow-md hover:shadow-lg`}
                        >
                          {ICONS.PLUS}
                        </Button>
                      </div>
                      {activeAlert[currentMainCategoryData.id as STCKType]
                        ?.instructionTags &&
                        activeAlert[currentMainCategoryData.id as STCKType]
                          ?.instructionTags.length > 0 && (
                          <div className="ml-8">
                            {renderActiveTagsList(
                              activeAlert[
                                currentMainCategoryData.id as STCKType
                              ]?.instructionTags || [],
                              (tag) =>
                                handleRemoveInstructionTag(
                                  currentMainCategoryData.id as STCKType,
                                  tag
                                ),
                              currentMainCategoryData.color
                            )}
                          </div>
                        )}
                    </div>
                  </>
                ) : (
                  <div id="custom-interest-section">
                    <h3 className="text-2xl font-semibold text-primary-lighter mb-5">
                      2. Define Your{" "}
                      <span
                        className={`font-bold text-${currentMainCategoryData.color}`}
                      >
                        Custom
                      </span>{" "}
                      Interests (as Tags):
                    </h3>
                    <ValidationError
                      message={validationErrors["custom-interest-section"]}
                    />
                    {currentMainCategoryData.tags &&
                      currentMainCategoryData.tags.length > 0 && (
                        <>
                          <p className="text-sm text-primary-lighter/70 mb-3">
                            Suggested interests (tap to add/remove):
                          </p>
                          <div className="flex flex-wrap gap-3 mb-6">
                            {currentMainCategoryData.tags.map((tag) => (
                              <TagButton
                                key={tag.id}
                                label={tag.label}
                                icon={tag.icon || ICONS.CUSTOM}
                                isSelected={activeAlert.customInterestTags.includes(
                                  tag.label
                                )}
                                onClick={() =>
                                  handlePopularCustomInterestTagClick(tag.label)
                                }
                                color="bg-gray-600/50 hover:bg-gray-600/70"
                                textColor="text-gray-100"
                                selectedColor={`bg-${currentMainCategoryData.color}`}
                                selectedTextColor={`text-${currentMainCategoryData.textColor}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    <p className="text-sm text-primary-lighter/70 mb-2">
                      Your unique interests:
                    </p>
                    <div className="flex items-center gap-3 mb-3 bg-white/10 p-3 rounded-lg border border-white/15 shadow-sm">
                      <Input
                        id="new-custom-interest-tag"
                        placeholder="Type interest and press Add"
                        value={newCustomInterestTag}
                        onChange={(e) =>
                          setNewCustomInterestTag(e.target.value)
                        }
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleAddCustomInterestTag()
                        }
                        inputClassName="!bg-transparent placeholder-gray-400/70 text-white !border-none focus:!ring-0 !py-2.5"
                        className="flex-grow !mb-0"
                      />
                      <Button
                        onClick={handleAddCustomInterestTag}
                        size="md"
                        variant="outline"
                        className={`border-${currentMainCategoryData.color}/70 text-${currentMainCategoryData.color} hover:bg-${currentMainCategoryData.color}/20 !px-4 !py-2.5 shadow-md hover:shadow-lg`}
                      >
                        {ICONS.PLUS}
                      </Button>
                    </div>
                    {activeAlert.customInterestTags &&
                      activeAlert.customInterestTags.length > 0 &&
                      renderActiveTagsList(
                        activeAlert.customInterestTags,
                        handleRemoveCustomInterestTag,
                        currentMainCategoryData.color
                      )}
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="flex-shrink-0 lg:w-1/3 mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-8 space-y-5">
              <div>
                <h3 className="text-xl font-semibold text-primary-lighter mb-2 text-center lg:text-left">
                  Live Preview
                </h3>
                <p className="text-sm text-primary-lighter/70 mb-4 text-center lg:text-left">
                  See a sample WhatsApp update based on the currently selected
                  category.
                </p>
              </div>
              <div className="border border-gray-400/20 rounded-xl overflow-hidden shadow-2xl bg-secondary/30">
                <WhatsAppPreview message={activePreviewMessage} />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop-only button container */}
        <div className="hidden lg:flex mt-12 pt-8 border-t border-primary-lighter/20 justify-between items-center">
          <Button
            onClick={() => navigate(PagePath.DASHBOARD)}
            variant="ghost"
            size="lg"
            className="w-auto text-primary-lighter/80 hover:text-white"
          >
            {ICONS.ARROW_LEFT} Back to Dashboard
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white !py-3.5 px-10 shadow-lg hover:shadow-xl"
          >
            Next: Fine-Tune Feed {ICONS.ARROW_RIGHT}
          </Button>
        </div>
      </div>

      {/* Mobile-only sticky footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 p-4 bg-gray-950/90 backdrop-blur-sm border-t border-primary-lighter/20">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <Button
            onClick={() => navigate(PagePath.DASHBOARD)}
            variant="ghost"
            size="md"
            className="text-primary-lighter/80 hover:text-white"
          >
            {ICONS.ARROW_LEFT} Back
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="md"
            className="bg-primary hover:bg-primary-dark text-white shadow-lg"
          >
            Next {ICONS.ARROW_RIGHT}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterestSelectionPage;
