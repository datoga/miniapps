"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { Tournament, Participant } from "@/lib/schemas";
import { createParticipant, deleteParticipant as removeParticipant, updateParticipant } from "@/lib/domain/participants";
import {
  addParticipantToTournament,
  removeParticipantFromTournament,
} from "@/lib/domain/tournaments";
import { startLadderTournament } from "@/lib/domain/ladder";
import { startSingleElimTournament } from "@/lib/domain/bracket";
import { startDoubleElimTournament } from "@/lib/domain/doubleElim";
import { getAllParticipants } from "@/lib/db";

interface TournamentDraftProps {
  tournament: Tournament;
  participants: Participant[];
}

export function TournamentDraft({ tournament, participants }: TournamentDraftProps) {
  const t = useTranslations();
  const [participantName, setParticipantName] = useState("");
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMembers, setEditMembers] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Autocomplete state
  const [allExistingParticipants, setAllExistingParticipants] = useState<Participant[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeMemberIndex, setActiveMemberIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load all existing participants for autocomplete
  useEffect(() => {
    setAllExistingParticipants(getAllParticipants());
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setActiveMemberIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Escape key to cancel editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingId) {
        setEditingId(null);
        setEditName("");
        setEditMembers([]);
        setEditError(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingId]);

  // Initialize member names based on participant type
  const getMemberCount = () => {
    if (tournament.participantType === "pair") return 2;
    return 0;
  };

  const memberCount = getMemberCount();

  // Get all existing names (participants + members) normalized to lowercase
  const existingNames = useMemo(() => {
    const names = new Set<string>();
    participants.forEach((p) => {
      names.add(p.name.toLowerCase().trim());
      p.members?.forEach((m) => {
        names.add(m.name.toLowerCase().trim());
      });
    });
    return names;
  }, [participants]);

  // Check for duplicate names
  const nameError = useMemo(() => {
    const trimmedName = participantName.trim().toLowerCase();
    if (trimmedName && existingNames.has(trimmedName)) {
      return "duplicate";
    }
    return null;
  }, [participantName, existingNames]);

  // Check for duplicate member names
  const memberErrors = useMemo(() => {
    const errors: (string | null)[] = [];
    const seenNames = new Set<string>();

    for (let i = 0; i < memberCount; i++) {
      const name = (memberNames[i] || "").trim().toLowerCase();
      if (!name) {
        errors.push(null);
        continue;
      }

      // Check against existing names
      if (existingNames.has(name)) {
        errors.push("duplicate");
      }
      // Check against other members in the form
      else if (seenNames.has(name)) {
        errors.push("duplicate");
      }
      // Check against participant name in the form
      else if (name === participantName.trim().toLowerCase()) {
        errors.push("duplicate");
      }
      else {
        errors.push(null);
      }
      seenNames.add(name);
    }
    return errors;
  }, [memberNames, memberCount, existingNames, participantName]);

  const hasErrors = !!nameError || memberErrors.some((e) => e !== null);

  // Check if all required members are filled (for pairs)
  const allMembersFilled = memberCount === 0 || memberNames.filter((n) => n.trim()).length === memberCount;

  // Get suggestions based on current input (for main name or member names)
  const getSuggestions = (input: string, currentTournamentNames: Set<string>): Participant[] => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || trimmed.length < 1) return [];

    const seenNames = new Set<string>();
    const expectedType = tournament.participantType;

    return allExistingParticipants
      .filter((p) => {
        // Only show participants of the same type (individual or pair)
        // Also include participants without type for backwards compatibility
        if (p.type && p.type !== expectedType) return false;

        const nameLower = p.name.toLowerCase();
        // Skip duplicates (same name from different tournaments)
        if (seenNames.has(nameLower)) return false;
        seenNames.add(nameLower);
        // Don't suggest if already in this tournament
        if (currentTournamentNames.has(nameLower)) return false;
        // Match by name starting with or containing the input
        return nameLower.includes(trimmed);
      })
      .slice(0, 5); // Limit to 5 suggestions
  };

  // Current tournament participant names (to exclude from suggestions)
  const currentTournamentNames = useMemo(() => {
    const names = new Set<string>();
    participants.forEach((p) => names.add(p.name.toLowerCase()));
    return names;
  }, [participants]);

  // Suggestions for main input
  const mainSuggestions = useMemo(() => {
    if (!showSuggestions || activeMemberIndex !== null) return [];
    return getSuggestions(participantName, currentTournamentNames);
  }, [participantName, showSuggestions, activeMemberIndex, allExistingParticipants, currentTournamentNames]);

  // Suggestions for member input
  const memberSuggestions = useMemo(() => {
    if (!showSuggestions || activeMemberIndex === null) return [];
    const memberName = memberNames[activeMemberIndex] || "";
    return getSuggestions(memberName, currentTournamentNames);
  }, [memberNames, showSuggestions, activeMemberIndex, allExistingParticipants, currentTournamentNames]);

  // Handle selecting a suggestion for main input
  const handleSelectMainSuggestion = (participant: Participant) => {
    setParticipantName(participant.name);
    setShowSuggestions(false);
    // If participant has members and we need them, pre-fill
    if (memberCount > 0 && participant.members && participant.members.length > 0) {
      const newMemberNames = participant.members.slice(0, memberCount).map((m) => m.name);
      setMemberNames(newMemberNames);
    }
  };

  // Handle selecting a suggestion for member input
  const handleSelectMemberSuggestion = (participant: Participant, memberIndex: number) => {
    const newNames = [...memberNames];
    newNames[memberIndex] = participant.name;
    setMemberNames(newNames);
    setShowSuggestions(false);
    setActiveMemberIndex(null);
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim() || hasErrors) return;

    setLoading(true);
    try {
      // Create participant
      const participant = await createParticipant({
        name: participantName.trim(),
        type: tournament.participantType,
        members:
          tournament.participantType !== "individual"
            ? memberNames.filter((n) => n.trim()).map((name) => ({ name: name.trim() }))
            : undefined,
      });

      // Add to tournament
      await addParticipantToTournament(tournament.id, participant.id);

      // Reset form
      setParticipantName("");
      setMemberNames([]);
    } catch (error) {
      console.error("Failed to add participant:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await removeParticipantFromTournament(tournament.id, participantId);
      await removeParticipant(participantId);
    } catch (error) {
      console.error("Failed to remove participant:", error);
    }
  };

  const handleStartEdit = (participant: Participant) => {
    setEditingId(participant.id);
    setEditName(participant.name);
    setEditMembers(participant.members?.map((m) => m.name) || []);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditMembers([]);
    setEditError(null);
  };

  // Check if edit name is duplicate (excluding current participant)
  const isEditNameDuplicate = useMemo(() => {
    if (!editingId || !editName.trim()) return false;
    const nameLower = editName.trim().toLowerCase();
    return participants.some(
      (p) => p.id !== editingId && p.name.toLowerCase() === nameLower
    );
  }, [editingId, editName, participants]);

  // Get all member names from other participants (for duplicate checking)
  const otherMemberNames = useMemo(() => {
    if (!editingId) return new Set<string>();
    const names = new Set<string>();
    participants.forEach((p) => {
      if (p.id !== editingId && p.members) {
        p.members.forEach((m) => names.add(m.name.toLowerCase()));
      }
    });
    return names;
  }, [editingId, participants]);

  // Check which edit members are duplicates
  const editMemberErrors = useMemo(() => {
    return editMembers.map((member, index) => {
      const trimmed = member.trim().toLowerCase();
      if (!trimmed) return null;
      // Check against other participants' members
      if (otherMemberNames.has(trimmed)) return "duplicate";
      // Check against other members in same edit
      const isDuplicateInSameEdit = editMembers.some(
        (m, i) => i !== index && m.trim().toLowerCase() === trimmed
      );
      if (isDuplicateInSameEdit) return "duplicate";
      return null;
    });
  }, [editMembers, otherMemberNames]);

  const hasEditMemberErrors = editMemberErrors.some((e) => e !== null);

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    // Check for duplicate name
    if (isEditNameDuplicate || hasEditMemberErrors) {
      setEditError(t("tournament.draft.nameDuplicate"));
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      await updateParticipant(editingId, {
        name: editName.trim(),
        members: editMembers.length > 0
          ? editMembers.filter((n) => n.trim()).map((name) => ({ name: name.trim() }))
          : undefined,
      });
      setEditingId(null);
      setEditName("");
      setEditMembers([]);
    } catch (error) {
      console.error("Failed to update participant:", error);
      setEditError(t("common.error"));
    } finally {
      setEditLoading(false);
    }
  };

  const handleStartTournament = async () => {
    if (participants.length < 2) return;

    setStarting(true);
    try {
      if (tournament.mode === "ladder") {
        await startLadderTournament(tournament.id);
      } else if (tournament.mode === "double_elim") {
        await startDoubleElimTournament(tournament.id);
      } else {
        await startSingleElimTournament(tournament.id);
      }
      // Refresh will happen via subscription
    } catch (error) {
      console.error("Failed to start tournament:", error);
    } finally {
      setStarting(false);
    }
  };

  const canStart = participants.length >= 2;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("tournament.draft.title")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          {t("dashboard.mode." + tournament.mode)} •{" "}
          {t("tournament.create." + tournament.participantType)}
        </p>
      </div>

      {/* Add Participant Form */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
          {tournament.participantType === "pair"
            ? t("tournament.draft.addPair")
            : t("tournament.draft.addIndividual")}
        </h3>
        <form onSubmit={handleAddParticipant} className="space-y-4">
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {memberCount > 0 ? t("tournament.draft.pairName") : t("tournament.draft.participantName")}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={participantName}
              onChange={(e) => {
                setParticipantName(e.target.value);
                setShowSuggestions(true);
                setActiveMemberIndex(null);
              }}
              onFocus={() => {
                setShowSuggestions(true);
                setActiveMemberIndex(null);
              }}
              placeholder={memberCount > 0 ? t("tournament.draft.pairNamePlaceholder") : t("tournament.draft.participantNamePlaceholder")}
              autoComplete="off"
              className={`w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 ${
                nameError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600"
              }`}
            />
            {/* Autocomplete suggestions for main input */}
            {showSuggestions && activeMemberIndex === null && mainSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <p className="border-b border-gray-100 px-3 py-1.5 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-300">
{tournament.participantType === "pair"
                    ? t("tournament.draft.suggestionsPairs")
                    : t("tournament.draft.suggestions")}
                </p>
                {mainSuggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectMainSuggestion(p)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs dark:bg-gray-700">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                    {p.members && p.members.length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-300">
                        ({p.members.map((m) => m.name).join(", ")})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {nameError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {t("tournament.draft.nameDuplicate")}
              </p>
            )}
          </div>

          {/* Member names for pairs */}
          {memberCount > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("tournament.draft.memberNames")} <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {Array.from({ length: memberCount }, (_, i) => (
                  <div key={i} className="relative">
                    <input
                      type="text"
                      value={memberNames[i] || ""}
                      onChange={(e) => {
                        const newNames = [...memberNames];
                        newNames[i] = e.target.value;
                        setMemberNames(newNames);
                        setShowSuggestions(true);
                        setActiveMemberIndex(i);
                      }}
                      onFocus={() => {
                        setShowSuggestions(true);
                        setActiveMemberIndex(i);
                      }}
                      placeholder={t("tournament.draft.memberPlaceholder", { number: i + 1 })}
                      autoComplete="off"
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 ${
                        memberErrors[i]
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600"
                      }`}
                    />
                    {/* Autocomplete suggestions for member input */}
                    {showSuggestions && activeMemberIndex === i && memberSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        <p className="border-b border-gray-100 px-3 py-1.5 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-300">
                          {t("tournament.draft.suggestions")}
                        </p>
                        {memberSuggestions.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectMemberSuggestion(p, i)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-violet-50 dark:hover:bg-violet-900/20"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs dark:bg-gray-700">
                              {p.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {memberErrors[i] && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {t("tournament.draft.nameDuplicate")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!participantName.trim() || !allMembersFilled || loading || hasErrors}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? t("common.loading") : t("tournament.draft.add")}
          </button>
        </form>
      </div>

      {/* Participants List */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
          {t("tournament.draft.participants")} ({participants.length})
        </h3>

        {participants.length === 0 ? (
          <p className="py-4 text-center text-gray-500 dark:text-gray-300">
            {t("tournament.draft.noParticipants")}
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {participants.map((participant, index) => (
              <li
                key={participant.id}
                className="py-3"
              >
                {editingId === participant.id ? (
                  /* Edit Mode */
                  <div className="rounded-lg bg-violet-50 p-3 dark:bg-violet-900/20">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-200 text-sm font-medium text-violet-700 dark:bg-violet-800 dark:text-violet-300">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value);
                            setEditError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !isEditNameDuplicate && !hasEditMemberErrors && editName.trim()) {
                              e.preventDefault();
                              handleSaveEdit();
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          className={`w-full rounded-lg border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 dark:bg-gray-800 dark:text-white ${
                            isEditNameDuplicate || editError
                              ? "border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-500"
                              : "border-violet-300 focus:border-violet-500 focus:ring-violet-500 dark:border-violet-600"
                          }`}
                          autoFocus
                        />
                        {(isEditNameDuplicate || editError) && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {editError || t("tournament.draft.nameDuplicate")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editName.trim() || editLoading || isEditNameDuplicate || hasEditMemberErrors}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          title={t("common.save")}
                        >
                          {editLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={editLoading}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                          title={t("common.cancel")}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {tournament.participantType === "pair" && editMembers.length > 0 && (
                      <div className="ml-11 mt-3 flex flex-col gap-2 border-l-2 border-violet-300 pl-4 dark:border-violet-600">
                        <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                          {t("tournament.draft.members")}
                        </span>
                        {editMembers.map((member, i) => (
                          <div key={i}>
                            <input
                              type="text"
                              value={member}
                              onChange={(e) => {
                                const newMembers = [...editMembers];
                                newMembers[i] = e.target.value;
                                setEditMembers(newMembers);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !isEditNameDuplicate && !hasEditMemberErrors && editName.trim()) {
                                  e.preventDefault();
                                  handleSaveEdit();
                                } else if (e.key === "Escape") {
                                  handleCancelEdit();
                                }
                              }}
                              placeholder={t("tournament.draft.memberPlaceholder", { number: i + 1 })}
                              className={`w-full rounded-lg border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 dark:bg-gray-800 dark:text-white ${
                                editMemberErrors[i]
                                  ? "border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-500"
                                  : "border-violet-300 focus:border-violet-500 focus:ring-violet-500 dark:border-violet-600"
                              }`}
                            />
                            {editMemberErrors[i] && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                {t("tournament.draft.nameDuplicate")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* View Mode */
                  <div className="group flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {participant.name}
                    </p>
                    {participant.members && participant.members.length > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {participant.members.map((m) => m.name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                    <div className="flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                      <button
                        onClick={() => handleStartEdit(participant)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-violet-100 hover:text-violet-600 dark:text-gray-400 dark:hover:bg-violet-900/30 dark:hover:text-violet-400"
                        title={t("common.edit")}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                <button
                  onClick={() => handleRemoveParticipant(participant.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        title={t("common.delete")}
                >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Start Tournament Button */}
      <div className="flex flex-col items-center gap-2">
        {!canStart && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {tournament.participantType === "pair"
              ? t("tournament.draft.minPairs")
              : t("tournament.draft.minParticipants")}
          </p>
        )}
        <button
          onClick={handleStartTournament}
          disabled={!canStart || starting}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-lg font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {starting ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t("common.loading")}
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("tournament.draft.startTournament")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
