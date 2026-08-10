export default {
  name: "kamailio",
  displayName: "Kamailio",
  scopeName: "source.kamailio",
  aliases: ["kam"],
  patterns: [
    { include: "#preprocessor" },
    { include: "#comments" },
    { include: "#strings" },
    { include: "#variables" },
    { include: "#routes" },
    { include: "#keywords" },
    { include: "#functions" },
    { include: "#numbers" },
    { include: "#operators" },
  ],
  repository: {
    comments: {
      patterns: [
        {
          name: "comment.line.number-sign.kamailio",
          match: "#.*$",
        },
      ],
    },
    functions: {
      patterns: [
        {
          name: "support.function.kamailio",
          match: "\\b(?:append_hf|drop|exit|force_rport|forward|is_method|loadmodule|lookup|modparam|record_route|rewritehostport|route|save|send_reply|sl_send_reply|t_check_trans|t_relay|xdbg|xerr|xinfo|xlog|xnotice|xwarn)\\b(?=\\s*\\()",
        },
      ],
    },
    keywords: {
      patterns: [
        {
          name: "keyword.control.kamailio",
          match: "\\b(?:break|case|continue|default|else|for|if|return|switch|while)\\b",
        },
        {
          name: "keyword.other.directive.kamailio",
          match: "\\b(?:alias|auto_aliases|children|debug|disable_tcp|enable_tls|fork|include_file|include_file_if_exists|listen|loadmodule|log_stderror|mpath|tcp_children|udp_mtu|user_agent|version_table)\\b",
        },
      ],
    },
    numbers: {
      patterns: [
        {
          name: "constant.numeric.kamailio",
          match: "\\b(?:0x[0-9A-Fa-f]+|\\d+)\\b",
        },
      ],
    },
    operators: {
      patterns: [
        {
          name: "keyword.operator.kamailio",
          match: "==|!=|<=|>=|=~|!~|&&|\\|\\||[=!<>+*/%-]",
        },
      ],
    },
    preprocessor: {
      patterns: [
        {
          name: "keyword.control.directive.kamailio",
          match: "^\\s*#!\\s*(?:KAMAILIO|OPENSER|SER|define|ifdef|ifndef|else|endif|trydef|subst|substdef|substdefs)\\b.*$",
        },
      ],
    },
    routes: {
      patterns: [
        {
          name: "entity.name.function.route.kamailio",
          match: "\\b(?:branch_route|event_route|failure_route|onsend_route|reply_route|request_route|route)\\s*(?:\\[[^\\]]+\\])?",
        },
      ],
    },
    strings: {
      patterns: [
        {
          name: "string.quoted.double.kamailio",
          begin: "\"",
          end: "\"",
          patterns: [{ name: "constant.character.escape.kamailio", match: "\\\\." }],
        },
        {
          name: "string.quoted.single.kamailio",
          begin: "'",
          end: "'",
          patterns: [{ name: "constant.character.escape.kamailio", match: "\\\\." }],
        },
      ],
    },
    variables: {
      patterns: [
        {
          name: "variable.other.pseudo.kamailio",
          match: "\\$[A-Za-z_][A-Za-z0-9_]*(?:\\([^)]*\\))?",
        },
        {
          name: "variable.other.avp.kamailio",
          match: "@[A-Za-z_][A-Za-z0-9_.:-]*",
        },
      ],
    },
  },
};
