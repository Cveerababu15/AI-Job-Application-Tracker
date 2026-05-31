const { scoreLabel } = require("./textUtils");
const {
  findCatalogSkills,
  extractDynamicTerms,
  mergeSkillLists,
  matchSkills,
  computeScore,
  TRANSFERABLE,
} = require("./skillMatcher");

function heuristicCompare(resumeText, jobDescription) {
  const resumeLower = (resumeText || "").toLowerCase();
  const jd = jobDescription || "";

  const jdSkills = mergeSkillLists(findCatalogSkills(jd), extractDynamicTerms(jd)).slice(0, 25);
  const resumeSkills = mergeSkillLists(findCatalogSkills(resumeText), extractDynamicTerms(resumeText));
  const { matched, partial, missing } = matchSkills(jdSkills, resumeText);
  const atsScore = computeScore(matched, partial, missing);

  const strengthsList = [
    ...matched.slice(0, 6).map((s) => `Direct match: ${s} — listed in your resume and required by the role.`),
    ...partial.slice(0, 4).map((s) => {
      const rel = TRANSFERABLE[s.toLowerCase()]?.find((r) => resumeLower.includes(r));
      return rel
        ? `Transferable fit: ${s} (role asks for this; your ${rel} experience is closely related).`
        : `Partial fit: ${s} — related experience found on your resume.`;
    }),
  ];

  if (!strengthsList.length && resumeSkills.length) {
    resumeSkills.slice(0, 5).forEach((s) => {
      strengthsList.push(`Resume highlights ${s}, which may support adjacent requirements in this posting.`);
    });
  }

  const skillsToAdd = missing.slice(0, 8);
  const keywordsTotal = jdSkills.length || matched.length + missing.length;

  const hasEducation =
    /b\.?tech|b\.?e\.|bachelor|master|mca|m\.?tech|degree|cgpa|gpa|computer science|information technology/i.test(resumeText);
  const hasExperience =
    /intern|experience|worked|deployed|built|developed|contributed|production/i.test(resumeText);
  const jdWantsEducation = /b\.?tech|b\.?e\.|ug:|pg:|bachelor|master|mca|degree|education/i.test(jd);

  const sectionScores = {
    skills: computeScore(matched, partial, missing),
    experience: hasExperience ? (jd.match(/\d+\s*\+?\s*years?/i) ? 72 : 68) : 40,
    education: hasEducation ? (jdWantsEducation ? 82 : 70) : jdWantsEducation ? 45 : 55,
    formatting: resumeText.length > 400 ? 78 : resumeText.length > 150 ? 65 : 40,
  };

  const label = scoreLabel(atsScore);
  const matchSummary = keywordsTotal
    ? `${matched.length} direct + ${partial.length} transferable of ${keywordsTotal} key requirements identified from the job description.`
    : "Requirements parsed from the full job posting text.";

  const gapSummary = skillsToAdd.length
    ? `Priority gaps to address: ${skillsToAdd.slice(0, 5).join(", ")}.`
    : "No major skill gaps detected — focus on tailoring language to this specific posting.";

  const summary = [
    `Your resume scores ${atsScore}/100 for this role (${label}).`,
    matchSummary,
    gapSummary,
    partial.length
      ? `You have transferable experience (e.g. ${partial.slice(0, 3).join(", ")}) — highlight these parallels explicitly in your summary and bullets.`
      : null,
    "Mirror the employer's exact phrasing where honest, and quantify outcomes in every bullet.",
  ]
    .filter(Boolean)
    .join(" ");

  const keyChanges = [
    skillsToAdd.length
      ? `Close the top gaps: add ${skillsToAdd.slice(0, 3).join(", ")} to your skills section with a project or course as proof if needed.`
      : "Reorder your skills line so the job's top 5 requirements appear first.",
    partial.length
      ? `Bridge transferable skills: add one bullet showing how your ${resumeSkills.slice(0, 2).join("/") || "current"} experience maps to ${partial.slice(0, 2).join(" and ")}.`
      : "Rewrite your professional summary to name the target role and its core stack from the job description.",
    "Replace generic bullets with 3 achievements that mirror the posting's responsibilities (development, deployment, collaboration, delivery).",
    "Quantify impact: users served, components rebuilt, APIs built, deployment count, performance gains, or team size.",
    jdWantsEducation && hasEducation
      ? "Your education matches — move degree + CGPA near the top if the posting emphasizes academic background."
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const suggestions = [
    "Use the same verbs as the job description: develop, maintain, collaborate, deploy, ensure, deliver.",
    skillsToAdd.length ? `If you lack ${skillsToAdd[0]}, build a small demo project and link it on GitHub.` : null,
    partial.length ? `Emphasize transferable stack overlap (${partial.slice(0, 3).join(", ")}) rather than only your current stack labels.` : null,
    "Add a one-line mention of AI-assisted development if the posting values AI tools and you use them.",
  ]
    .filter(Boolean)
    .join(" ");

  const topMatched = [...matched, ...partial].slice(0, 5);
  const rewrittenSummary = topMatched.length
    ? `${hasExperience ? "Developer" : "Professional"} with hands-on experience in ${topMatched.join(", ")}. ${hasExperience ? "Shipped production features, REST APIs, and deployed full-stack applications with measurable impact." : "Ready to contribute from day one with strong project evidence and continuous learning."} Seeking to apply this background to the responsibilities outlined in this posting while growing into any stack-specific tools the role requires.`
    : "Results-driven candidate aligning experience with this role's requirements. Lead with quantified achievements and terminology from the job posting in your opening summary.";

  const tailoredBullets = [
    hasExperience
      ? `Developed and maintained ${matched.includes("react") || partial.includes("angular") ? "web application UI components" : "web applications"} using ${resumeSkills.slice(0, 3).join(", ") || "modern frontend tools"}, deployed to production and supporting real users — directly aligned with end-to-end ownership in the job description.`
      : "Built and deployed a full-stack application end-to-end (development through production support), demonstrating ownership of assigned modules as described in the role.",
    /ai|hugging|cursor|chatgpt|claude/i.test(resumeText)
      ? "Integrated AI tools (Hugging Face API / AI-assisted development) into production features, improving workflow efficiency — matching the posting's preference for AI tool familiarity."
      : "Collaborated with team members on requirements, design, and delivery while providing clear progress updates on assigned tasks.",
    skillsToAdd[0]
      ? `Currently expanding hands-on experience with ${skillsToAdd[0]}${skillsToAdd[1] ? ` and ${skillsToAdd[1]}` : ""} through targeted projects to strengthen fit for this role's preferred stack.`
      : "Ensured code quality and timely delivery across multiple deployed projects with JWT-secured APIs, role-based access, and clean MVC architecture.",
    "Delivered measurable results: [X]+ production components/pages rebuilt, [Y]+ REST API endpoints, [Z] live deployments — quantify your own numbers from project experience.",
  ];

  return {
    atsScore,
    scoreLabel: label,
    overallVerdict:
      atsScore >= 70
        ? "Solid fit — targeted tailoring and gap-closing can make this resume interview-ready."
        : atsScore >= 50
          ? "Partial fit — strong transferable skills exist; reframe your resume toward this role's stack."
          : "Significant stack mismatch — upskill on key gaps or target roles closer to your current experience.",
    interviewReadiness: atsScore >= 75 ? "Almost ready" : atsScore >= 52 ? "Needs work" : "Mismatch",
    roleMatch: atsScore >= 75 ? "Strong" : atsScore >= 52 ? "Partial" : "Weak",
    roleMatchReason: [matchSummary, gapSummary, partial.length ? "Transferable strengths: your background covers related tools even where exact keywords differ." : null]
      .filter(Boolean)
      .join(" "),
    sectionScores,
    keywordsMatched: [...matched, ...partial.map((p) => `${p} (transferable)`)],
    keywordsTotal,
    missingSkills: missing,
    strengthsList,
    skillsToAdd,
    formattingIssues:
      resumeText.length < 300
        ? ["Resume text is very short — ensure the PDF is text-selectable, not a scanned image."]
        : [],
    summary,
    suggestions,
    keyChanges,
    rewrittenSummary,
    tailoredBullets,
    analysisSource: "heuristic",
  };
}

module.exports = { heuristicCompare };
