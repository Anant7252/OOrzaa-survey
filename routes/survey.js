const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

const VALID_TRANSPORT_ISSUES = [
  "Transportation comfort (e.g., seating, space)",
  "Punctuality of travel",
  "Safety during travel",
  "Cleanliness of vehicle",
  "Driver behavior",
  "No issues experienced",
  // Hindi
  "परिवहन का आराम (जैसे सीट, जगह)",
  "यात्रा की समयपालिता",
  "यात्रा के दौरान सुरक्षा",
  "वाहन की सफाई",
  "चालक का व्यवहार",
  "कोई समस्या नहीं",
];

const VALID_ACCOMMODATION_ISSUES = [
  "Cleanliness of rooms",
  "Comfort of beds or sleeping arrangements",
  "Availability of facilities (e.g., hot water, AC)",
  "Room size or space",
  "Location of accommodation",
  "Staff service at accommodation",
  "No issues experienced",
  // Hindi
  "कमरों की सफाई",
  "बिस्तर या सोने की व्यवस्था का आराम",
  "सुविधाओं की उपलब्धता (जैसे गर्म पानी, एसी)",
  "कमरे का आकार या जगह",
  "आवास का स्थान",
  "आवास में स्टाफ की सेवा",
  "कोई समस्या नहीं",
];

const VALID_FOOD_COORDINATION_ISSUES = [
  "Food quality or taste",
  "Food hygiene",
  "Variety of food options",
  "Suitability for dietary needs",
  "Staff behavior or courtesy",
  "Clarity of communication from organizers",
  "Responsiveness to your requests",
  "No issues experienced",
  // Hindi
  "भोजन की गुणवत्ता या स्वाद",
  "भोजन की स्वच्छता",
  "भोजन विकल्पों की विविधता",
  "आहार संबंधी जरूरतों के लिए उपयुक्तता",
  "स्टाफ का व्यवहार या शिष्टाचार",
  "आयोजकों से संचार की स्पष्टता",
  "आपके अनुरोधों का जवाब",
  "कोई समस्या नहीं",
];

const VALID_HOW_HEARD = [
  "Social Media",
  "Recommendation from friends or family",
  "Online search",
  "Oorzaa website or communication",
  "Traditional media",
  "Travel agent",
  "Other",
  // Hindi
  "सोशल मीडिया",
  "दोस्तों या परिवार की सिफारिश",
  "ऑनलाइन खोज",
  "ओरजा वेबसाइट या संचार",
  "पारंपरिक मीडिया",
  "ट्रैवल एजेंट",
  "अन्य",
];

function validateSurvey(body) {
  const errors = [];

  if (typeof body.consent !== "boolean") {
    errors.push("consent must be a boolean (Q1)");
  }

  const scaleFields = [
    { key: "travel_satisfaction", label: "Q2" },
    { key: "accommodation_satisfaction", label: "Q3" },
    { key: "food_satisfaction", label: "Q4" },
    { key: "staff_satisfaction", label: "Q5" },
    { key: "overall_satisfaction", label: "Q6" },
  ];
  for (const { key, label } of scaleFields) {
    const val = body[key];
    if (!Number.isInteger(val) || val < 1 || val > 5) {
      errors.push(`${key} must be an integer 1–5 (${label})`);
    }
  }

  if (!Array.isArray(body.transportation_issues) || body.transportation_issues.length === 0) {
    errors.push("transportation_issues must be a non-empty array (Q7)");
  } else {
    const invalid = body.transportation_issues.filter((v) => !VALID_TRANSPORT_ISSUES.includes(v));
    if (invalid.length) errors.push(`Invalid transportation_issues values: ${invalid.join(", ")}`);
  }

  if (!Array.isArray(body.accommodation_issues) || body.accommodation_issues.length === 0) {
    errors.push("accommodation_issues must be a non-empty array (Q8)");
  } else {
    const invalid = body.accommodation_issues.filter((v) => !VALID_ACCOMMODATION_ISSUES.includes(v));
    if (invalid.length) errors.push(`Invalid accommodation_issues values: ${invalid.join(", ")}`);
  }

  if (!Array.isArray(body.food_coordination_issues) || body.food_coordination_issues.length === 0) {
    errors.push("food_coordination_issues must be a non-empty array (Q9)");
  } else {
    const invalid = body.food_coordination_issues.filter((v) => !VALID_FOOD_COORDINATION_ISSUES.includes(v));
    if (invalid.length) errors.push(`Invalid food_coordination_issues values: ${invalid.join(", ")}`);
  }

  if (!Number.isInteger(body.nps_score) || body.nps_score < 0 || body.nps_score > 10) {
    errors.push("nps_score must be an integer 0–10 (Q10)");
  }

  if (!VALID_HOW_HEARD.includes(body.how_heard) && !body.how_heard?.startsWith('Other: ')) {
    errors.push(`how_heard must be one of: ${VALID_HOW_HEARD.join(", ")} (Q11)`);
  }

  if (typeof body.would_participate_again !== "boolean") {
    errors.push("would_participate_again must be a boolean (Q12)");
  }

  if (typeof body.most_positive_aspect !== "string" || body.most_positive_aspect.trim() === "") {
    errors.push("most_positive_aspect must be a non-empty string (Q13)");
  }
  if (typeof body.areas_for_improvement !== "string" || body.areas_for_improvement.trim() === "") {
    errors.push("areas_for_improvement must be a non-empty string (Q14)");
  }
  if (typeof body.recommendation_reason !== "string" || body.recommendation_reason.trim() === "") {
    errors.push("recommendation_reason must be a non-empty string (Q15)");
  }

  if (typeof body.recommend_referral !== "boolean") {
    errors.push("recommend_referral must be a boolean (Q16)");
  }

  if (typeof body.share_own_details !== "boolean") {
    errors.push("share_own_details must be a boolean (Q17)");
  }

  return errors;
}

router.post("/", async (req, res) => {
  const errors = validateSurvey(req.body);
  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  const {
    consent,
    travel_satisfaction,
    accommodation_satisfaction,
    food_satisfaction,
    staff_satisfaction,
    overall_satisfaction,
    transportation_issues,
    accommodation_issues,
    food_coordination_issues,
    nps_score,
    how_heard,
    would_participate_again,
    most_positive_aspect,
    areas_for_improvement,
    recommendation_reason,
    recommend_referral,
    referral_name,
    referral_phone,
    referral_email,
    share_own_details,
    respondent_name,
    respondent_email,
    respondent_phone,
  } = req.body;

  const { data, error } = await supabase
    .from("Questionnaire")
    .insert([{
      consent,
      travel_satisfaction,
      accommodation_satisfaction,
      food_satisfaction,
      staff_satisfaction,
      overall_satisfaction,
      transportation_issues,
      accommodation_issues,
      food_coordination_issues,
      nps_score,
      how_heard,
      would_participate_again,
      most_positive_aspect: most_positive_aspect.trim(),
      areas_for_improvement: areas_for_improvement.trim(),
      recommendation_reason: recommendation_reason.trim(),
      recommend_referral,
      referral_name: referral_name?.trim() || null,
      referral_phone: referral_phone?.trim() || null,
      referral_email: referral_email?.trim() || null,
      share_own_details,
      respondent_name: respondent_name?.trim() || null,
      respondent_email: respondent_email?.trim() || null,
      respondent_phone: respondent_phone?.trim() || null,
    }])
    .select("id, created_at")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return res.status(500).json({ success: false, message: "Failed to save survey response" });
  }

  res.status(201).json({ success: true, id: data.id, created_at: data.created_at });
});

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("Questionnaire")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch responses" });
  }

  res.json({ success: true, count: data.length, responses: data });
});

router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("Questionnaire")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return res.status(404).json({ success: false, message: "Response not found" });
    }
    console.error("Supabase fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch response" });
  }

  res.json({ success: true, response: data });
});

module.exports = router;
