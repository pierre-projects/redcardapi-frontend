export const RED_CARD_HEADER_TEMPLATE = "You have constitutional rights:";

export const RED_CARD_SCHEMA = [
  {
    key: "do_not_open_door",
    label: "Do Not Open Door",
    required: true,
    sourceText: "DO NOT OPEN THE DOOR if an immigration agent is knocking on the door.",
  },
  {
    key: "do_not_answer_questions",
    label: "Do Not Answer Questions",
    required: true,
    sourceText: "DO NOT ANSWER ANY QUESTIONS from an immigration agent if they try to talk to you. You have the right to remain silent.",
  },
  {
    key: "do_not_sign_anything",
    label: "Do Not Sign Anything",
    required: true,
    sourceText: "DO NOT SIGN ANYTHING without first speaking to a lawyer. You have the right to speak with a lawyer.",
  },
  {
    key: "if_outside_ask_free_to_leave",
    label: "If Outside Ask Free To Leave",
    required: true,
    sourceText: "If you are outside of your home, ask the agent if you are free to leave and if they say yes, leave calmly.",
  },
  {
    key: "give_card_to_agent",
    label: "Give Card To Agent",
    required: true,
    sourceText: "GIVE THIS CARD TO THE AGENT.",
  },
  {
    key: "if_inside_show_card",
    label: "If Inside Show Card",
    required: true,
    mergeIntoPreviousBullet: true,
    sourceText: "If you are inside of your home, show the card through the window or slide it under the door.",
  },
];
