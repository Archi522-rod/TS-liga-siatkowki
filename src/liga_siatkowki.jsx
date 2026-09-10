import { useState, useEffect, useCallback } from "react";
import { Trophy, CalendarDays, Lock, Plus, Trash2, ShieldCheck, X, Check, KeyRound, Wand2, AlertTriangle, Copy, Printer, ChevronDown, ChevronRight } from "lucide-react";
import { storage, adminAuth } from "./lib/storage";

const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
:root {
  --navy: #16303D;
  --navy-2: #1E3E4E;
  --oak: #C99A5B;
  --chalk: #F2EFE9;
  --amber: #F0A93B;
  --grey: #7C8B90;
  --rust: #B4573F;
}
.vb-root { font-family: 'IBM Plex Sans', sans-serif; color: var(--navy); }
.vb-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.02em; }
.vb-tab { border-bottom: 3px solid transparent; transition: border-color 0.15s ease, color 0.15s ease; }
.vb-tab.active { border-color: var(--amber); color: var(--amber); }
.vb-input {
  background: var(--chalk);
  border: 1px solid #C9C2B3;
  border-radius: 4px;
  padding: 6px 10px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  color: var(--navy);
}
.vb-input:focus { outline: none; border-color: var(--oak); }
.vb-btn {
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 600;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.1s ease;
  border: none;
}
.vb-btn:hover { filter: brightness(1.08); }
.vb-btn:active { transform: translateY(1px); }
.vb-score-input {
  width: 34px;
  text-align: center;
  background: var(--navy);
  color: var(--amber);
  border: 1px solid var(--navy-2);
  border-radius: 3px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 16px;
  padding: 3px 0;
}
.vb-score-input:focus { outline: none; border-color: var(--amber); }
.vb-score-input::-webkit-outer-spin-button, .vb-score-input::-webkit-inner-spin-button {
  -webkit-appearance: none; margin: 0;
}
.vb-protocol-table { width: 100%; border-collapse: collapse; }
.vb-protocol-table th, .vb-protocol-table td {
  border: 1px solid #16303D; padding: 6px 8px; font-size: 13px; text-align: center;
}
.vb-sig-line { border-bottom: 1px solid #16303D; height: 42px; }
* { box-sizing: border-box; }
.vb-header { background: var(--navy); padding: clamp(14px, 4vw, 22px) clamp(14px, 4vw, 24px) 0 clamp(14px, 4vw, 24px); position: sticky; top: 0; z-index: 20; }
.vb-header-top { display: flex; align-items: center; gap: 10px; margin-bottom: clamp(10px, 3vw, 16px); flex-wrap: wrap; }
.vb-logo { width: clamp(30px, 8vw, 44px); height: clamp(30px, 8vw, 44px); flex-shrink: 0; }
.vb-title { color: var(--amber); font-size: clamp(22px, 6.5vw, 34px); line-height: 1; }
.vb-tabs { display: flex; gap: clamp(10px, 4vw, 24px); overflow-x: auto; -webkit-overflow-scrolling: touch; }
.vb-tab-btn { background: none; display: flex; align-items: center; gap: 6px; padding: 8px 2px 10px 2px; font-size: clamp(12px, 3.2vw, 14px); font-weight: 600; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; white-space: nowrap; }
.vb-content { padding: clamp(12px, 4vw, 24px); }
.vb-match-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: #FFFFFF; border: 1px solid #DFD8C8;
  border-radius: 4px; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;
}
.vb-match-info { display: flex; align-items: center; gap: 14px; flex: 1 1 260px; flex-wrap: wrap; min-width: 0; }
.vb-match-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.vb-standings-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.vb-standings-table { width: 100%; min-width: 480px; border-collapse: collapse; }
@media (max-width: 480px) {
  .vb-match-info { gap: 8px; }
  .vb-match-info > span:first-child { min-width: 0 !important; flex-basis: 100%; }
  .vb-sig-row { flex-direction: column !important; }
  .vb-protocol-sheet, .vb-poster-sheet { padding: 20px 16px !important; }
}
@media print {
  #vb-app-content, .vb-no-print { display: none !important; }
  .vb-protocol-overlay, .vb-poster-overlay {
    position: static !important; background: #fff !important; padding: 0 !important;
    display: block !important;
  }
  .vb-protocol-sheet, .vb-poster-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; }
  .vb-poster-round { break-inside: avoid; page-break-inside: avoid; }
}
`;

const LOGO_DATA_URI = "data:image/webp;base64,UklGRu5UAABXRUJQVlA4IOJUAADQ3wCdASosASwBPlEgjUQjoiEkrHhccJAKCWxu/GMuztK9YaMzzH5P+0NXH6V9/v65+1PyK/wHhd1n+r/qB+Vfr3+0/tn+V/cr5nf8b/de0H9Bf6v8//oC/iH8n/1X9n/vn7afRP/nf7H2uf1n/Y/rR/l/gB/S/8N/7v9P7t39v/7/+J90n9f/wP/Z/s3+Q+QD+lf4b/w/n/3kH7w+wB/Uf8p///+X7t3/A/b7/qfJh/UP9h+0//P+RD+jf5T/4/uP/////9AH/39sL+Af//q1+wX9+9GPh199/tP7df2b03/HPnv7l/a/2f/vP/u99DMX1cf7v+f9S/4/9rfyH9p/xX/A/xP7j/d/+O/2/3G+hf5f+5f9D+8ewF+Lfyr/Af2/9sv8P+7f17/cdlfvX/A9AX3C+of5r+8/uT/cPi2+L/4v+Q9SP4H/Gf7P82foA/V3/afm7/i//n76Xgffif+T+wvwBfzz+5/83/D/lD9OP8//5P89/q/3U9uP6J/kf/D/m/9j8hv8y/sP+9/wH+W/9/+p/////+77/7e5D9t//t7rv7Mf/pLSRYP+pMAUL/8rrXBYGhT5eyem145qU6W/M68XHf7iCcARhiOn5tvQqwMCLAj3/O+cp///sf9kO/rjzfVQYbInwEKJDAK18i9fq8p4GBfoHbcaOiTWXJ9e0Gd9oOphy9lgbC6gEGA+TYc4Hu90jB8TE0S87onq72TeP/NPlAftW2E3IXYz4PW3PPWhhFB/ZUF6HT3M1eevXKquNb5+zx17IjoBosbu22OqUWM8+W3WAOcPZ/MgPb6FqbzBdbW+BZ5oiy65tRGOgKlu2+GJiG0i1MmUFa4hNYMH//8kpH/Efc7ASlXpVUJtdtT/pFdq76KDLUziLHqd3QfdyQ5oYtjBtvtsk74e3+wBimFf7rVu2A1wrpYr5R87zrV0sTuiqcd+BpJw+aTsfi8UIHA1nv4dy6vLQ78+fixYPeEkMezOdyKjMnlUTnACtb+ZxLj/oUHp+yttC1E2x+YZSWRi4GAdnGY7cvoJ9MSayxeBkCPUlioS5tdXOojSPh9IQO2x7+ZyLrP/+/s/vKuae/EocHZGA1K2nqhn9neOTlCc9kZuOC3HFDoKSg0vYFxdtQucqfMAb1IgIxGIJH7c+L/9HtQewv7tuZZutOiTsCOSTHuzeS0jBNm7efO7XiLwFs+7AOZn17tRq6DTMeEF9pffHvq3UNbdzgEQcHokVrvsntdpgPvU+DU9ocUkH6CfuQ2HtfeEOif98ZYNaUstrH+hx85K7yXwfYz9vJwEX5HlXzsbgeYc4OtAVRFYt69Y5aKG9Udd0djaeTlkDDlec0NU82o8yaDKU1TFKfrDnIchlPXEuUbSoI+tWEgq9SkpoVlLaBW+IxBppL4eZGnamI01cM7xv/wVD1DS2OD+Yqf/Qrmu2y42Z0t8O+DGRJSlp4EEOmumrZj4Y5iZBjdObsaXukBnNVeoXWdvjo+4pjTdPx14dkL9eq0BSbK+deZVzlAppCg0y6JilgHQdB1FTZcP05BWU9tmLPo9dPju0eSeM7szDaxHzOFe4QiEcXffv73Ta4bmbovh/y6kZVBtHeRKWDYBPih9DwAsdQNVpfGbYrsS/VrZJCRUt1Y/AXjwx0xNEsvhLt1IYsSsgvTsPSbtn4y1zjGFnE25XFiqjKwEGxoV+ciHKzg5O/wnw9tF2GSdu7o8uzFgr6FRY5kf2DaWnabAqsYaJripDkm+J2Us38666ScBWPTr96JphxhdUkc6Ic8xiDjN68otxeSfWxv692xGosOB9O02wpjdUGNiLJ7wTrKJWHCDmKuqNWsfYhqVVGPt3S67RS5RLlk+9YdJjeBbVEESLZZRzUPKXRf8iIxXymis+NqD9V4Uv8QsDP0lUPeM83mtPrusE/mpb1F2u0spz2C3AvovwxXi33OI/RCSqXjCgNVifqPXGfE/8CR9BvAZwhApGVfTzXDLuwupAU/ma/qk92Hul+47mOLQg/lqJoxIHHa2AEg9Sz9j4974XBMsHBL9c7PYpAE7Ssh9fwEzEMwsnmqE7JX15+Gf3SQEm2PjrTVA115qgEvq7Ci5Py2IlNqZKCEjr4aeX2jtfIBekfmWYDIDAbFSXZ/gwdWOd0uuYxEBGjolAhFPX/J5PjCR9mzE0WLzXKFAPF9tZoanD2N5XTYVdOjmihbxSTfeQidtnT9RljVL5yx8O8GMIP/JM4UfWE2HI8nzV89TrzTJvJs/7FzXeZTDVizXd9inXPGXuL2+0YPszjToe5UJ+ou5jvD0FV+gOVOvUrK/U2stql0/fBtAIMCKMCd5kOyD1gVE2pAiph800Y9qo+7wNvduNDeBcZWf6ycoP7H4wCrAwIsIcXB3y2X4TqgVgwIkgAD+/gmgBrjUmIf65Jq41zbJdB9dJYPv1a2Qz5tn/fBMpkhtOPSjD/8j9YfkPviElQe+tgSQnlBRpEuTT/P3NU9Fi6175bZN3HSjEsfMJMfYuV5nR9F2QNAj5CIfUZJnYfoWDuFO7Tag9ZHYZyj5W6K5dYTts9yPkQLYeZQEbwrs6k6y+sRuLFxozl+uBGU99/MjD0e16Y+dhThCxUF3pIu0ZWKn+pIT2opGfFjPpB4+RZVNROM4vqTUYi/3FxF9XqV+7gbJVY4onf4wTttrBpG4dIhLfEJ2krTD/z0xzUUjZuqJx2KAH8IT4pT6fW7x1Df/gxPk+eP7mE5k2rK3HxCE8DG7yqayhM7L+4usb7pVrvZNCm+MIVwE3eqTfWFVG4JGECFo4W1z3kILpZvR10aMo9F+lftf/hEcLMTEbnq6zzN0B/GQ5tmLyCoTacJyC5LMAXMxNLA3L0foESTZbQXx6226PgQn7KMB5ybD4kEHOGLHx3wwQ3lzeGKyJwmTb42cqgJfeFfU8bMb5ZuVrS7jgofTV+arc2ZWsipQM5xdoDTkg7JPCjAmSlnuRnWuRPeh/+RwOkfDdfkmT60AVDp99loIeKwyOvI/0kr/rCUtVQJ4EHFwucV9xpT3ERU0TrqiehRXSmDLYMx1CX/hA8AX/SsicyEN3UuXgIAAAi3tWRhDHXJiiqd4/w927lpkQgYrd7U6zIY7gY94fNDWQhnbjoJk3c0gZ7EGrocN+DVZqaTFWT79z1IH+D1BaN9FTz08qR+x81qDXdF5VySjVYpPOo6M45+szKIfTl6PVsqvpnMQzfYq0PZdvsyKujWpvTOzhjWpCfRjUnqYP2O6gHj3GCEbUQtqlh5V6HVx1b/mWLjE+2lHA0eMPzAmSOEZX7yk61c/T+bBxXu8oXxFZE9qBPSO5cdLXGpLrv5ktoA2npIFr/ap9lIk3o7kLy/Kk71UetLOrvvwG+MIyc1znZF/MrYov3vyU+c/Z9dwrFLogdZ9cFq9/xlhLA6QrYTFtsNyItfQDpuZ/AxmETuStCtE4ijfckE2VnI/WaD1GFNIVCoe5l1sqWUDyG7PWFQUVQm/NvSxCw+SnzPEZf+kVLXHuKWnR/LrgApi5Cbwj/6YGQSyLxaFJuOQkVZ++dlomVLAt5BIDhIV/d3IBu/h3dK79KO8g9UFw9h/93IH0KG7GVVUNNoSSrFlbYZvYVrj9vLq41MAT6AJSwFDUr1jQ4VUTONutmk6/rAQFqYvd04UMJkCbZrL/lKFaX7FsKLGY/+Z0Yjqtm0gs1jP8Y81hcFfEFSq5GR18XU3gGh4kDlvUu45DUGriurOvKu/ef7/N34dlNHzB+yrJm6GJmR4j48QEESBV6yqHzRILR/WPG3NNqgkMLA2ijALw79Xa1P0ElEPVMRr8TKE59wLpxouuL23IvJ/KpPQHLDCbjJNAkJXNnZ02yX5WlWD2IZGNo2G/g3/pCpqwxjGnhR9TJ4UmVQ0w55EK950a+csNAx3CZbliJtInKchM9mCUUzlwSSAU0WzSkxbkFrwOZtNufikDDOhEOWwsxEbaY9UTFe0zzsyXd9ibBo6Kfpl2uI//e3lJbAtFBpSZrGZudOBcZIU67KVc6NkJK8DB3vepraWRFAKV8fZsL7Eq2PBV6O6UK9RZRegWUFYNFYoPkJIVJwj/GnGBa29ZUyzcg7HW6Vs/tzRwdHga489vT6Y1UVQrlcRsTrZUUaIz0IrP0ge41yk4vIkFbnPGVSrkhzv2lVtTxrw5QDxGfCTjb+cq//pGV2NkDfhKE0cmJVKOuQi10Q0QkASE6/OPotVBceM/f+bYmqhU6VEcVFGaPbolWGtbFbbGjAs2WIqSqU9Uu5WcuJTR8seD583vwqw5PlOKYVjrMVfrhzrfo222Pm4FxL+muCCujRFZd7wrWU8kl4/HbrMpWT1pbpilyFmG7lWTKLZpMDnU3RKQAdz+a8ioAAm30eXR3wmjbHqr9Rptpa8DCqOHHI8NNeHUdt+I/8wMLtkiXifIrZquVsOawa2YyJLWJLauTi+qd4eedetHup9C49GCLKbTWo7wrCbkvpR10m+xLDCCf9Kr10JmGrwMplmdO0F5dEcO2SFOnD1u7uL3Ixx4VgvBmU6od+FH6Qfh4sy6pBnLX2VCLJ7l8xLWkQvP+uxP7P3OrBv1OwOu+abqVT8iBjhx7PtA5Xv91zC/n392+loOXfLfuKoxwWNg0Ro4BNKAjQI++QSlN/3QGbUnUkoYmS1ve5PZO3L6re3UzO2iPX46cdIkCVZ2RHvavSFmC5uRx8IHkBNC1WdqBxtvYet36ndxm2FRPWTMYbj9RoZZYZWMEzexqLL2fAsImAQL+sNBnRadNGPzGnvC5iBFfs8LTrEDyEgUlzk+hkY3wLbEQcElvY6beYkzgLudTqEmC9AFc4D58H9sXK0L9NfOGEyZ3LfEyaNcrDKiqQkpgj4Q5ewCpXUOflBp6Px5Md03NdLnSR9dKY24W0957NY8aD+JJ97ZQhFxLKY/1DJNcPWVG+tpNS9eT2ZNKzVpA2TJPtYYJKxAAhbV323br9hqoqUNrLKsUHTyvLNZq/AMjeF3goqviGF2pobsjwLWkGIR/ncuvR+mTRZzLUIeU36onTEZ1rDgmk5qrsULOg8rUmGzKHFWzj9pY6HZBnaYKx62m/TKT7MKWrQYwOdObJQjug9XGbeoxH1JSJq4e52fvykDJoescYPoIZM2d6kJx8VY9bGnxmY8nfAepCr42rjuDMBY24BKoEDyxUjIDq2tdmWloX+STxuUf1i1V8B+nBJwR/wlFBCo4EV+U/mVQOoAHW8/KZcDecmPBSo6G9ZwVlfhA3PQkjmcPWFwzjcS0CaHAHUT0l+/aldr9CsZ6dSWoU94GsiSdK/EhdL7+FZm9LindBVLczvKi2UlNJ8Q0wWFtFH+9sKMGlwQJhLy70EN2ew+n8jDkvJZTAzjpP2VgZltBJJN5Ics99HaRhQGenDTZIBZoRdSc9dAbYaGH+AoaBmtcLwgR8R1AqzuzLMRUSD20EzILLZO478qEgmosp4AH9MsjYiXPVvx2b5c0HvCx4X4VC8X2veXBqJIfaMVIqw/SVB4iK5iP7Oq0CDBgh286Pb3Nmui3AtIUnRTHV0+ZoTryFOI2VSZavXQ9zcjYGv7I8pLcgLBO0wgchbtZ1meMR6/PTtScuxLWVN/Z7S9JsDObJwgxGqrY0yjuR5r2/2ToPFJmglfyZjI1t4hGT2dtSiNiM77kd2OdDlneMxpz46erJuqkVvuqELXLQOrGb5nvkt0XEKxhzTasi+4G3eJMxC4iqGIcdE99f6kUoxePmchGkLX2rb7GhTGhPHeH3jtr4RvG6VDJ4t/h4KRz12A6+Ti0R5NRvZM0Gq0kuwzFwBH3eqqv1l/EYGvn+zHetZE4oK2vAhXzkC1wYgBhOUjIOL1RrqH90xxNpjPay4IX7AxJrxaJ9ZawArurWXdTqFXDn03LNb14f+f4eawexrXTlKceFlsScLlew+HlHHJ8flYAH58hvDtwiEewdGYwGAiW9Qkby8aDWGOvqplkHpUHCRyk2KvIqTIgdZGM/aAkXJObQPqv5vUOk1pPCYaTf6D8wJkX3/aCuyWLYeIxHJW3hq8LQqgsAfSKqZbCCac/FmU5iCpDTwPyX3c4g6rV/xieG22ItWycGApKi+1Hqnq9riNTAZZrTRdsxZJ0ybXSJgIE5WbLnlJKeM3m6p0OffoZb5h+E+IzTQECRTpytFVVl320D8I5aaU87NIWPEslYaC46D37MmZ9/JM+JWfpFqDkPEP2n/whHXJTY4jC9osQMRY6+Whrqii48w8e5PWeyfFgm+7iZTzmeS2FH4N2vt2mqlL1B77V1NSFEHXj4pY4Alzd5N1HxTK8MlhKJ4nNPne6Koyv+suyzu8jigduuWYBH1C2lgJqHEZMHkBzNxXXg34tfNf1uNRsRKIcj4Z1CS1Z90HHG/OQpq5NVTd+ZmX5PXH+S1CRdsZnHk21TBrfEkNViGtgZ0IkC7vgb/NvYa385k9oGIGBycZuK2S2g1nza5075AlubEHrH4088zltWoM230SqnNsuCTHJYk0yyZGM5Q6o6VFhTGE6UBoJv/LPd/PS5Zeh/iB64FFBAgZgDOKaChMot3powCQ00ESGDcrD3GqMp0P9fwzusFeOW+vFGcnx9TIxAYWmh+XFeTFfDPEcvhCeuhhnVo2p/1JdMLLRFpwM71Sn1opKmv48okowtDdfVg4y3tNzFm+UMEWnbAC2J2d/vi22uTQKInjb4gconDIY+al8M5TTMWrQGE2wi3/A1cAKccG4RcR45eCJlmznMNGWeSx1yQB1MLTZxIVmK/20ymFq5hBHyAIFbDx/q+g9Ruc2sp2xM6ZPCTr0pEAhsVyRl4OT+6vXUKkHt5S7QxsPwlqnwmempL8Ze6nOV47rNzTtuTsYrah6TYDxOUoLCUklFa7Tkb1ZuMUmpmzwbiYYn2rrGUdgB+gBvLzR+Simy6VO5hAuiiHHqyJcnkzzuI6mlXHhhX0NyfFz/MqgoptGJYKKHgzsW/44VxrBhcqI8pNl3yJ7ha7kFRGW/L6hO02J+8uV/N9f8E4keK3sRGLAndCHWprMIc+8dWoHvlQh/qEkcvUmM2ej5uxo3vz93AtChDb7DQVQ/LgvCE27FNvb6FSPd0fu4B4Uxwb/009AgtIL+NG+9Dd7UnKcqCP8vhtJdAFI1poFJO3IusYZAbPGEd/5NYg8Pwbm3SOJ4EcYeSOx49BmqFMw9xMUa2FNepcdoVWDGNNSM103Jlj3ChuBBGlNiyO4iCHYy1j2R9dt95otuh6QdrsCt6GVdiJpjDHThF/lfG0gxk/FGw+cCqjxPfw3J04tmHG2JXEhkwsSo33ry5dWYWg+EarYG6BcmC9Dfgl8SdrKMxqCJF8qXb7SxCYjfgIn+IW0tOoa8y9u7QNSmKZZRU8CTyjx3Vk+X2kDPOmS8poD1ve75CFLbKiHNWx1h5EvXY0Zz/9Ot/i16jICidTTQu3R9VeRqASD4F7L1mL14EBHRbbnvf2j+OUFNy8aTGif/zb51GiLkXS0uWRsenOZ3V8rgysJbdDDxF8WRtCWPCLV6Xq1BZJBxPMsesJD2danDP6F1V0tCOqEGm6rD4x02RlSxFq//bVKJb7rUQZU6w7bScj15rriZh0qnemaxnyy9alKf7F4RjQoad7o78QN4v46/X4MANRlG+Xh5lKQLVYnzircz8nklE4ygIF01FiGFdRkc8bxae0lWCYnUTP6m1sWoHGPXpV1Ab4n5xXOIR4kIYhrVHSYhg3kBy4Nm8pH8nZ8bRlCjosVFSxWMJTIMzYcUbf3shLD/CJGYsKlWUdQ1ygi6Eya9kCKDePgT3ItwqjYijGcCHMecB14gmgZHesbF6/PT6aHaS9rsNhZNHyrGHrrQxY6CziW4xVjabvR2aBT5LdvHP6RDKo9PGvSJUjJAfXxPgSkash6fD5U2Z1itM87YNJJ9ZdPyK0nMqeHA4kTuJsKd2AKiU/YHwZzEiI1pivhanCpx7S+GwBe2nNT6jL+Lg9TP+W2vcjib5/hZnUqjbLCYXaYfcKLibbmXzcH3WRKMpbpNpzM8RDaM5n8toTZrrUQQY0bYD1Z9QxqY86n0IonvxZYFwDH6WDcGat0/fvGCfupZNAvoqAQPN29Kw8NWOsDbDQVSKfVgUpejXNSf4guE+I72M8CDYTudOSfKVtHzJRFgeejtc25nUVWij/0mlLV5I+yTfOt3JwTI82EVtfUNAACMS4BkG9HJaLMFWWvk2CadjGhqIsLb2387A5IR7AVi703UM6lwTJb8DhN5e4mbScBPXDass0tpbqWbA825g8+VgKUMuxvOI6EBaEB8H9MCpEjPqdW7Sli7FcJ+aAiJqV6pPSObHJQFDtDktGxqVbRCw4url0r+osnT03IByOXdu6L2MaiviF2SE9ugR9CmWhcyyCy0fQLzWfKqcW354jbNJCtgWmpSSo4GM4dCfjqeAvnlK7entcjaITvi2jTH15AZdFEcBQXzQaVmmv/rrPWDyvvv5Gpar5njqOuqRLRTdxOkHY6mALX5MxHeLqqbsu7kQwo9zIc+fYc5LRHIcUUVpKQRgtnmEq0cJgiQsJZUapkUV/VfDCZUSqrmxnrYB0qeZO8nYfjDhHVz6oiIZpBqEclK7DPkf71dxXkOt1lRmJ18LHdbNyslTvrwiCa3AegYMp5Chxd/yoFKoo9XzKmAonUnZuSNETPWV7iZesFAcnkJiUboN/LEfJDT/iqMYpGLXgnsmu5V43NxOINtNGUvmCG21Izxt8OXNlS/QKExSwYF7OiRQLu+c2TIDJvfUBiAWSfFVbUxEbI3fWIGMK5RweBTRHyWOBRiPgvqca3kGBGdQrkYYYbGuOtTMHo4MCkssZhpfIaGxYz5C3yP3JUmdTXZv4wGDu36Lry4VNssgpYyEZZw7jbdZdwG/B7uNG1PsJJ+7I1WI0XYvFdVfFwlGC2I/otIjfwfYEjzD1f19ghp+uanAblBBulbf7u7OWWTsly0kiQ5733nxbsRFcldvWM/DYLbkFezN9oRR6JTouOaBtAZ7Jk9xrG3My0JVPuf3i4mGuUxM63mkKUVjaTYEpk+KH/MHLUMeHH7+q01L75JXVnzVzPmoKTcP5ZS4UXrt2/A0FkD/FwNFfpKWle2bas7AqhzZkwA5gdaHNQ8f57yKOwnaK831RAmPkF/74PzQg25brM42NAQLQYJ5vSydQjkVlZxqaY32Vjb77ExqorJhBtlt4VwNGR7ZKYSQ91je6lBDTeJ6HV/268Sukp9f6AO19Gc1ulpeap9orRQazQx8NL1Jy7BDoracjbIHEyX88WGKafITPYyYQsLr4NiPQZhHvO7q73Hz9t/t08jaI5DNS6fpW5aepOUFGl4abitQtI+3+zVsY6nBKSwwnx5b9X4I9VHnFT7UqaAjK1Yr21hPl11PVlzcZDMNaw8jhDTNucH6rIAoyeozsqR0DvleZNhOYuVJ2NQHtRDMXSRqd4CfjgLJI77aavSFMj12sIAt67xoG210gWs1+YoIp3rNJwLyVhd+oQJSEIZNGAQ6C107YgDOZhBpmLpJRb3FdFVqp83L4F7kYrbsDmdr0qHaHXQ24vjj3q4YT3g3pFEWJJ/GyzaIdjjZkHQvhvu399FwhVCd0BqVO+Kf+D7hF9eKXOp78TP4ajGvGvkWsPgTDiBMMwsGqQCAFQRsnTDR3PWIScbamBlcW3z3NdP7MYfVkq/GQRg/0ybsMt3mLQg46lvhg2Tml79r7OVGqRyzxUBE14CR0NmNBuhEySu2SVMDirYKSHH6bkxv1VHcFdfLiU2hh/q1l4nzV7HswFKQ3PyfH5BdQ8+KqA6dg/II8NEh86HQ7RV2aMXnGiBdhCD+nHWmAczlXiy+bn4sJgTeYwzbuldN35mzXmlXCZWBkElY5xFFJQemhErsX2z7T+tfRPZ6YhhijZljX2OWDcd9CHx++unRb+qkbs/eVM712Ap4RgXRAewhvwAYlqCW+knVMP1BYEVf8Opo5pGpDbnX9oo4McjxWVua9p/tGZl5GFpo/IgCVET/Nil8RAvREUL9AzM+J/bN2/hIwxgmRvOPHQbJNsmVg9lk5eyRbHg+1PAnPLGDFczZIBTH4YaKiAykbjLL4s5gLdF5FuCIOPG2h/iZjB2K4cxLwnRi0nQvc2grm3TNndfNIyP+q/Q+xGZRQupS4znJOP8nEf4eqUg/hMeI+iFgyLJSmdYk+zrE9LMoBfcIqvWbwYABQtulDqNH4IMpL17M9+PEeIPD1Bis6aM+1Umwb4MdVlgX7TIUXhct8iJU/O8XOJc4B/kR91HPaNJN8MyPDoyDCpsI9gsQWuh1tkSaehVqTebz6w7vrkV30642wFohPqz/LytNkbaPF/G/9Y1zxwrXXewlvMOysyDuRNTzNicwLxGg11zoFHVUZUVi7anI3PW1/IgP7nefAY51ME7GD3wuYJG+MMVoRtp6y3HAGH13wY5CQXlxAzFGLMVhMqE4iVF+pYpowW9Glq8J6ULgERPg8KZm9wehVBl6pYXRFmuolBHL/1s8TrTZA0vEPo+xqqUOQjSeTEaCnI+H/MP0o5yAPsvaATxCVVzE/vgWegGdxa/Ms5P7Bd7IMXyv9u9kAVyS3j0WE5ArzQ3mWXu/0+mhGdBD8kw9LWZ6ExsQn/JKX5KmscO/bNFLyXFXaUS7bC+Qd9YWne+27eI+dHeccE24JzAQDkyHsKl57M0pp/xgSSEXRo3JNMXj25UW0WhHkLfFb7NI+59QYmgONLDGy0wl6DjkJ54cov+9lPZK0qlYcyxA0/7zJvBnQP3pH9BePxRmGIBvLaC8P2RPso0CQr/6Rpd7SqfObrrO+InVyNKEMaRyZFLg9WjbaQgiNvRh+pC8nYaMauTqV9ScA2E3rEIyzg6nS2J2Naf2g56FOuUV+xbVPXKKtfwtkq58C2RnF81kyanflCBrSQR4F7zFhwPCmqfnnlEdoi9W6bESAxojjs63j5y1Cv4UTYbSW0F1IQRcp1u5GJoeLEgF/cwHaJwIJ6LOgHRPNk/pWSnqJgwwRQEq9kg51BnVAVaqdalt93Y0V9zDI4+J5Xlw9b0gi7zI8l12/NL6GCqDL52EDhM/6BQNP+lnKKTFuRFBmu68XOSp9AwlqDrnIjS52ztPAX5ctEYY0x0ImWVXMX0/NS57vkTGIWOWCZp6+fgqJvw/qRnfN9yAjBg85DBg+945P8xfKzJ660huMgMoUSCP2sDurUJegnobNAe61YdT1yyiiPqtc6iojMq9oVCyu6x59QczaTxGF7y++IHCm0SN4SuA8yTVKX8amxmDNjUWA79Kr/PytpMEqpClJdoSBTZhR0rW29urcED81fuZU+aA2CJj8PsGaG7nE/zH9oD08mC+Vv/lh5PX+G69QJBm8M+fRw3btLMccUnzfzWZspCuVSFFE3/s3clE1obk+wBxdpOFby4SmIekmnmP+D1eVvoH4c6IS+YNNSm8TMufvleZEiKz8F6DJK94utffiK+RPV9vwaVj7qwhpjWx42wClriI9jeXmgLLTuPIO8IWAgRQIMV1ga3+HO7Eq/fPNYp63uhmn4e9TV4jTnnkxXx9HPvWLgJ1Y/xw4OggbR+cLdxDPk0U+bUtLOM0NN56i1YBZVt70HZlhHy7Gp0UO80HgIXDZTf4LYjNbsXIhpKSSVhL733BZ0tQwEDUxDrihJuDhcc7HWSCMchPrAtkm6vwkDGo+tsTr+YaUY7/24lO/m2NWfrCjfb0GwtCc+aLdguU/OIk3sP2tZ8mEyTKIJe0mn/fffv96QLAWp+QVguZOOedQNluzAvVUQ6ib/27vZIIirf+a232YkusKHtRCqbPiLXgnWak0Rm40ePV0/DuMuE/NH2KX22pQxTFBkmT8JPEHu8ZtfzCe/ZXJ/kbar75rq8Oho96ikPNq48wfV6tDovKztKQt1+Gbm9NnGfNqXiUF62y8SsIvVt+p5Q5Bngml3KZIxM5NvkFXo7ern+w1PMb/mQia5qFLysbt8XWYHiawixU7aO/o6VcnP37yuKuSUt8qirysJCNrTYY/tNus8LTLb9YrMEptL0eHeCZoUpKd9WgO9KJP1rO3wqikqF71TmshTtsTpFrOEbmzYc89HaJerdNt6w26OOFgEwP1t8N6LuiuGEmAjvuZ6/jSEPJNng96Va1g5pefyopnBbMrQY8W8ulaBuXFUtq1RSVlrZEuIZaWwpUPB8UK1gehvme4g9qi5fM8pP1qSGGvsJmatBiy5vdrXmdy2ZvEbnXKrU5a92dReWuydAvGr1eqnqFJEOhjG4F+LoSyj6uh/QqB6WvEJ7iPrP1yo1THg2E7p7OBsH/PhvAFsytx6GIIc1Fe/pWiSlaK40GzYF35luD2ER2uYFRzsLSHBoKBQXILf6j2xXPRCKdprL5zZH0cKEEGPhtAGqiXFYsn89r4kg7FmUrYj3PSCJx4OuWK2aSAiEEqQlkC9K+TS9iIJsoWj3QBU+nfnqi/S8PLSNn60Nb9BAfR+WFKO/2uV2aq94ABJM+LdNOxsx+GQ+4taWJoiYP/2p8DruemJgZSLFCrolxz6zY0cDxGyeblxq45x7VxcEyqxI1Wo9ibRPDG7WYjrHCYWB1FMuvnRcU7VYT8mMNrNt1iEisRAybNogZ57ws3qdvAwQtdSwCU4gtrleX902hUAa99rJWtqXWMaJOYXluw2+TbyuJAp7lNpN3BZZVjkcxkzTLJMNf6FFAOimzRjKPa5eqwzfERhBzDsN2T0gBz5EvApqYNHF3w81+bgCC1MY9QFs6VL64fLVaAKP+RKyrrU29+As8sz8hWO0UwiV/U7/0/gvFm/jWqak7msfO0RaRR+dJi84kFTy8jGyaQltanWWlRBaLkypUC7mR8odQHKkzpD0pe5vsmNgWmShYG2ATgLymCv2v55IcoZofq5OvfkA8r0ciNi95HsIvlHIprqjD02KdRixH2pjEn5OZ/xLP+simzWLKsA+Zs8pw4lpFySiQBGtankSyec87ATkEzd4wuQR7iKLpdeMttbaqGg5CNnKQ8i/OpjlKJGHDGChsO5gx511VZLNRKQ+H+1WqyajnxPHKF83hIeiargW5CQ3edvzq8I0CWP+SHHkli2EYfJYgeIkkN1hVIOQEPlJmTM9/gRyQ7E7g8SSvZ9eLxawM+ooHfrfjUSuV9U7V7wUeBzPzi+FLo1JzwuR6wFFwdUCG4PfIWTOkARucGcukjt6GhESWbtvDD+3Qw3T+zFyXfw2flGzjrQh0bysv5QzykUBqT+GfwxCacyMmdXzW/dLtPzPivWyCVt1dMlOCCw/gvEMdOZe99X6IsWj4uTbJMhVVB6YMKM8DdLSlZFkMn0PD+21ihvHO1xslMHaQzs0zr/MB0W5tMTyb0+kQyzArPqwdgKEXINXQK1hcoftcN3yLZ6OZd8m3H0UIvZGfxqkkE9UBG9YeQHB9AzZVqcJqq0QtpNVjctJlX5zkkTj8ooww1xZ5pa09A+fFpM5Isub1yQjrPF77Q0T03PVseP+q7sgA1m2qi/hDyfXAw7v9WuujgVa3P5WNhYLfNgaqxYlVV8qUgMeVTjwhrKSyQEQr40AUAsupjQ4GKhSvq0aPQDGYDKxfhkHkoWGoFLH2S8nMZHT3As/LVN4Xi69IVemxC0uoUPxRKOlNOIWErw5lc9dDpzoLgMQbSXoOPVgsXhAXoSGumsOvtLfTLC8KgCCDTAcaTC4yqsEGH5GobhM/x+ih8HNr19mCmYOFcZYdfU/bX697ESDNEPgMXpEkYNJVqyK4NIQNldO3sAKDpD4/k3wQOWkv7ANMnNmDgD/aE1cE9aBn+8VMhTqOupX4eQaCLWfTT/GOb2UwM34D79x8dhXxYXVG665JAmE/Ac/Kzg8YUZnHyRxifPy0Lco0HN8U1jWL6whoRiGWOjlsWebBTgIhlgBvNZwIVZmDtV9qAALjRwcDFyjX39rZB57afku6VhIBlBzQ+kHQc6+ktBw93+5YrVjeYxaBFxapSdm9uZp4wySRPeskirPDXK7LwJ6Q+4fbwZHVkMxrOiqPme8XqLdOai/VtCkmsV79RZ2QaS8z2nNK4lPaDJ/rnRM/6mXi5Zg94K5bmKi4n8/6SgsIjytosAKe+EGnI37sXQgZ91LMz/HtOZ2ZgUUF2dj3VZluyNVzHbMuyd7fAQYhj96M2cmYC9cP5iwucxGfhZKjgyohI/ZXhuAODE9/heG7rotZhbC8J5J6jLKYg6fzcaDwYxwxSIeqnWLdGTefh/fu/rlxV6R1Io6WJGrPOJmX8f0kC1uqFSabWAIde+BjW2CXYE8Hd1n0rdVPEroZSXUWQgGBDxHqsLk4xtd4LizK9Xy69UbVAYulqgmZW1B2hAU+p125KeWRX14LCb3TzdrzoQZ0b+TBqKQN88bg6ef9GnaAYg7F934mpbFuLK0rDCXhSn/EBQ0dGw2WQyDthNJdxw9PT99xgu4p91sZM6FCYnBpWTwmVKu/6b5beHJFOJPs8sDbFY4rjlPHgE52p/BNfKXiGi5PvpSDPWPWOtFN5+bnSDtz/BufKwTz9kbkHzFuwASqlKtvsx0jNjqKlLiGj3Kj14FRJf8O9rZIX1Rl1YBI07gjjNt3NrlDvEADkQfDqnbmEEryw+TN6iG0Hc3LfAaN0BsTC5tiD/5FXbHhZST5s71a3kdjF7PTXOUIynri8w9kBaO10NTpO0O9tXPA3kIjBJMG7nQoBU8yyr6v3DA2BR2t/nUuBEah9wU4r0oMSCwkYU3lsr9sNa0MdjZyrBvKMAUURCTHYb7h+Ang5sm1Dg0rzwmfTUu6TB4WKvGVT4mKK+edN0qgpWyPMYpbGd+AI2Hk3m9ispdHqRe+SUcbiHs/PhULA+iaxbVJDs30i8qHnborVAV66EPnnwWvP0L8MTY6/MFOUglBlkEKye5z9347NG+HEcNu4JejZcLp/Viy3n7LT45DwyhOExZciHGrewM5dOb2jmvyumnKdI7MiyQIXAvNBlwWDGm0lq5TlBA4YC/7rPS9uBYCfMw8A5UMCJVUozGKfugkeys0vk/2im//NHcosre2QbO870jLPgahECyU6OnnfP4ky41TF5GJQ8hAABB+HRgfqpZvIdb0CHPYxI/y0nCbh35VJoTQQZ5sSPjby/jZL9uEM5RS0DogtS3J8m9bj57XNJrtwWP31bpfYJVu9QzJ02ZmisSYWdfWraQWq1BICV8j9lOMS+Y4cHTk92ZbIw/UwTDh30AwFjr2/4NnifXQunOwjDCDPKVMFn/XjhS4rq5MKLKe18AYKCoXM9hkWezsfzeb0sXkO47YAjClotXuWulEP6eyKB/IcpCkz8idIqZCmzF1QCFAytZRJ7NnHV8e5Q/a2Z8HbeKrPtec8oN60bpjjQ7jSAPdCmtJGGLWhqCxQByaEOemkLa2Xf/iaeuHNlrK0aHKFOT6LSlplqx3K6LNenoYCWTQfVIy4dWQrgD1VjELqb1TN+PH1rtBmwIgwGoz23zcWVfsimwLX2HSEtRxDfqfD0G2Cobe5rsbx2Pqw1umpLHHjf20VYZcOIJJPNXFBX+gjS6Cl+hrMDW2ytkSH3A8BlfjEEVd61iydJQIwIzJ5Tyzly+9YO8WMBl7YGuHtvcRKGw5ZvAM/VBUuXChgMne5F+MMC8wgy0V8FjWwtTgTvcggYL7DX7rOCugS6YELCS/E4Dm7G4OvBAeOwAf7m8Zi+KEmoyQv7YIit3rOgSEurKbier8S9eJihyyFLBiB2m17BfmwcWxa5/rwEYp77q2fu0g/GGQys0v8JP3jyWRjznH/VsOksN8TOaO15L+gU5LdZohIF1gQhUTSkOBWEwLwjubUyxJMjhK3FHuh8/ksei2e5bhKAV7M69rfcXnP2k9DdUJqNnG+GLSx7ZJ8cm/nv+YpmegavHiKRVjfqVdnQpzuF2IqjazLI54clK+LiMRuVCVYhrHkZUH1R6/kyJpeTqAjNlHZaW0aCI0gn/eWPYGmWH7gdamq/Hilk9od4E6ni7UzXGmQdwENIZjh48BMTFNL9zBRCRj0L6hM7g+dv7NWr5vJyTMWyKdnqttIke3XEILip/6RoVIcSberA+5C0EloIhBUtO6Zn2qnEgnW0TIzR/Rav3oDurvyGIE8S2K3UngrDYE3XCec11g1xu0Ufi8lSy7Or+MbJvK19vRfnZ/wxsEKCp3xOrPmkNlXrjZUDf1DFtP6B0VeowjfcpRUuiVALj8gZicxM7GZxUf+3bRBhO7trND9lDm6INtq3mWZQ/lE1kqGit1Xxah4Akhw5RlkGkUsEPqDUXqVIpH4eONQKcGN+pH3d09vBmW/KY88FpDzulOaiS33W1Izwx9dF8eS7+l9pkqFrJssWWXP0ZGpubnAeDU3m2h8Uj9zaH2pSnhyTsjpn/pMbeT8sWt2fc6MqWh0gRCoXjfsZJAlPA5wDf61awkKj1cO30E4nGy6JIiE1CrlTWN8mau6XzFBIIb/zZYvYKVjv0yLkFzhRyGCKTOZiidjSF4isNMOcBO9DhXDUBJa9UyAZEbQWXmkLyTLIGgcvO0HzjpWiEtqUCeM0OQeJYiq1eXHrFEc83oQfnd0l5+F/02JEMfUwXPF2b6hpxGMpD8yoAtJj/iVHJiv1S5QMx89U+2odq98eyh6rVq9Jnz80WlRAYiPAY5FZztxVts9foz+4zHPEz68kfUvYmB8GgVhGmtu/+MgiJAvWk6+nX0xLorsW3Gd60dLqWmB4b6fAJIrNEvpKpEtP1E8xzSVnZEAnjo5rLe6sh3TVJiG9j+0AZjo2EMuZ3A27LvfRgS66VSJuTk/EbPwfJ12Z0jTlxS3fQG3Y6Fvqj7ufGJ/asemECTWeNtgFtbgIKvHxnvk2J/0ToNB7lY/2WtVYB5+eO+vNix/ZsZ7ZH+q1ahWusAFnQFF3s4+g/d/nFfdUJ4m19aelwzgw6VNiRwciUopeYFqWjOU6HvGG2JvphNYGOkPDrZZUwfI5KlXYDwhujT1od4L4vGk7nIXBHgLFAOPxRUy87YB4Y5if/3Tabm9+0s3IkIAVdOMCc4/oX1HxtWG4lEfazqgQR2ZTdDFgMXKST1MM23AE05eYAzfVazQSbROvQUbtgf7ESMY5KGMoTHANP3r1tBWLloiJIFWx+em27SXQRgIy4/2otqrMkDgfeVkQPjesVCCoCL6loX8RzJ9EUzBnhXfVV8CUJtZ61GNcUSsKzq1mlrP5mSh85GpByO2+GINWrEZ1cP+1gkHZoPZze2S6PE8tM0VlezOjS4l2GNKTjXH7Nr2XoH4wZKYSVeiCQODUfCBzHP9OWqwwxmI59G1KJRC4Me1taugRO2wCFTwmhv9XZV3dOixgU+m4wPkWd+QWycOboQZBRAqxiMRxGjvG2nZ0GJaDrOLHlzh5sU9J8W1aDy0pE5q2Htyr93+EFLyWRgonjzslZiplQvSl/caMy/cuGOi9gDjLhRSLIHL77PuZV4mAzu9n3Z8Hm7jp3YE/HmyWneHpZeAjMscOOKNcBHMZTGGC85WT7BmNouwzav6WJnTBB3gLu0r5w+kzAP+6RosabWrNFf1Kdu/LvDty6W87+AVDV/F7Hqn5s0LWbBuTrDTjob37Yc8cEizQYjqFvqiL2CO7EmxQ5kDuifbdi9Q7h4Bx0UagmgmYnmWfsGyHv0NR4vUGAYWN7vPm0ibhq6aREtbpq6gsJa+bJX/dJiglStgIMrq0FqkgRjcSUFRftB1v1CALkkAtUWUZihaN21p+xN03maXSMMVowZn8FpRlzhIZTmZTwZ/W+pUlnMb+GH8U7sadjQ1yQv/IETD9tktvoZI6XOxNC4MhjLKPdJewB2WNk/QS5Dn/EVuV0tB8QxCChegq9BNBqdbFGFaCo2UxM47JpFhANgO0QzBJAPDpe48/Z5uGxOdfEKt8Ik+5yJUqWTa4TjQEWeyK3KINu5GbgEE2dUAjEJlROjzQTY92pXI7jtO2gHHGwWk9b95D0+uxtxnxkll5HFMjrzvzdjk2Tl7KwAxjYKMzZC4TWf52DzlOYU/VqxP0MuMi0nbvhuAXhQHsrA0QsX/D5UG14/lTB35Mgg68ykeSQiyC+dS7M90QMmZlPnghBc/6xfeZsYlHhhsk/sC0+DDbclMxTicsGXuiE7PTSlZO2hoLRTqtlO6dx+DfF0Rp0tp4N86/Ul/eIxGdY+hNqR8aFkV2CVSjAQ6BzcJry8DbLqHJOFVr1M2B9MriNkgqvdudZAJUaboKc1dYFOgx5n8ySdNnaeUy+C7bxbHGhznDNAsesVqS+cdMxKpZmbTZ1Z559lEhs+qNEhbXwefMBgMI16p2YTGulgdvK0xsDG/ky9WdpDAoicymzUiL0N37pfms8l03HJh1qPDTcOiJ79hE8lwmlovt+MI6GpYmTz+nQalCVPkq+osxVWFUlFKugw7XmNMD3Rre3mxEkdV7Uot3qk6ktlA6r86wkmt/wt3l883lv/rsstqNWiwTFhXyVMY0e46PapV7O21vKgR+H7gpCKL0eZuo+iv0iXattiN+OKgUbCkwnqeLX4Rkd3Fd1AMX38c4aNYWKCre3s1acPEWVN2fsxht2PWdx6x8/rc+wJSD1NB4x2jf00YxljT6JJ9783UB0NbDiuObXIRKUohUU+dUptXm5ZIThIER2Qt43fNc0cRs7U04xU4d3mxj5SN0/9x8fwagyrlSQ9ReZ8Et/+cThb6gVSeplBZ4XYENZHfdOdjIte5aX0DuLc72eg+DsGa6+Ff5K3zF8C/IiMPtiMig88DVzOel8irvWSMJW+vhJo1qPRhOtHIldy9BWJs4zqq2+8SIp8Vk1TS++ucwXpnGWwJ/Bob7+INkNC4Si2pCA7jnnOu/SIO8yvcimctolhdMLfu3l40PD0RpX5XtK28Ql7lI6zkjTM6Z2fxtKsVHCKmRG/hbENSdvrx5Kz+C1v/BEaSjSBvWon/fWBTvu/o7DT9x3ZHq8kxYU2ISoP2zl+4JHbb10WU22q1RctUsYwOWxDURA9AE6dSkNVqnuQryvzqRirjxXFAB0TZs071mdyTOHeb8FejjXY7JCOkI0IJiT/eIugeiy+ZdG1hgPYZFLqTu7n6EAtmER3UkIij2ebOkgGanhneO5sgI8zxdSyYOOMzfIyCuzC2o6z8Oh7+fR03Sq+VHJ/MkRHFut96yKmmaxK+AD2BI8I3++Pgl2FdUaPCo8A8FNqTos70jqo7uUzUX1Wz9pykyDfQgSDqgSB418PAuq+7DeSb1gEAij2ZXktRleCC8uS45Usm3EMRBO0dpdgvgNeKIYqdqopMay7FKbcKpaH+T0fFoOkm3bs5kDnz/gDZsAXOQZAtUIpgnhk9PFRFGxw/h5uMfbQ+uwLZp97M5eWLxSsqCE3oI1JqqlxdB+hpvlvcxuI4XEvNGpofJqvAyQDBFf8b6AUJ3ieyH32lKnamZLUbziMlD3qZJvIWLxl4+tmoqTLWReCfP1eu2+HUz3rIvWrl1Q1hSwysczHUeb/0H8VlZCttTYV2ekgwEtZNFrQnMf+bVoOWLr2R3dlYgw/UMOP+hGiiG5uZTV8qsdFZsmwURxWr6CYCgE7t4Bu/upHw7wPTjDJzW/+qj78e3BFAXbk6owy+mSF8MtemS5XwrhkUGEEWLQQTARut9LLynM2A0CPkH4o9byLid10ITodLSdLmenhGjoa8E+d7VB9WaC+4g2Z2QXSjfEo99vDljwopJF+jL6kOpZfbKhnXC87yL8OAfJ3FG64IkdX8j3sxRwsE1g6HSTooOKqr1nz+/icA9bbNA9BUVRk2lngcKUkcSSPoMfOF0QLLgTKjeV7crW9OZXfavfndzMRUr7rOguQO5FTJxI0LU/bm3meO1G4SkE9QcSF7KxyRbjvEo98rTJwT7fMFwVwGlmt1o5tkT/n5rtIUXCsLcavW4+n3TfRo1snY8PkNq3kFOgUalumk/+9KhOzZ52Nd4RoQwHZ/zgBZdYpAsV0FiB3u9sq6HYwe/MdXFV3FrROPgPL3lCFxy1AGxTHNV1cVqoEPP1IGNc17YC7G5UmN81KCqF+Ol0HDZpyHZzO+o5Koe/ZCNhQnraXwds0laY5O8QzQXnuCQ6v3rCE+EiSNz2OBzRU8G9dB4+1TDQjWA7J61QvJ7c7AiLLrOnfU7qGtzo9VcPt9YIu3zZRIB+dW5zIa2+9Q8/+0XvgPgeKHiNzY9jaKOkn4Rx8hsUvouj7xz++qKrKotp26vrrr2t9gLoOpXX5FyDz700SfnHITRcuOKkroRzOfa3NWCY5q9iQ+g7mMqG7guTV9bbTAHm/iyGwdt4rDGdrh2XENI+lmiPOwp45binHKlXNBQImd8c0KjLKJbzWn7GnDYuaafkmRAbNfc2haf2tilzJ7Ok86k3kWNv3Gy7ogqf0XqVnd+7jkX3JAGS3jTVfRm7YpF8Rd2Xmhw64yi9T6/767r6wX4a7f3oFs9L7G5kZ9Lmfe0MdOTbf50FqhDG7+0fBRF3fiinWaNE1xOsU0AEMw7qjKuM5UIR/5jtP8p8hhzHBOUIb4iXLmkBaS+aJ+eEQnJO7sKpA0ZQkSQbyz/xQiGochjU8mjdThWDx32ZiCnUjtMQLrZAoKym1aZDnW0bFJSBQcTdMSazGu6PjGBtIzkt4Krzr9U4oiUbsHHm77G7tvs2Zoq8MdppQjzHjvYFfenejYDSdBa9uhZ+v/EBYHpfq0xilszNhGGw2e4+c5DwGgTPm9zgvAwyLEoU4El4HQy5RT4Y7Xv90K1JBnhnYrPkQkpfWMM4zkLczWfFKcRqigQ5Op4/N8DE24WkW67r5NORBZOUx0zv8dpw3XoAvu+65EiVWh6I2+k3T9XDs+HRMVvfywubakyaumvnB2pdzUwlGw5raLKCahmsiaofZlHfjhp0r6XPIjJyjBvRc3NWBfRrdoNU4CcMVD2lpt+zaim5XNYf5+siAzHu3dgNkT0IQffNip+5t38FfANxQB39y1nBuHxFGd9cFkUkFfgZPso3+J8qqSqInr0SGYVWAzte8N4xoLyrksClEPxpCHsaOSmIinZyXk7VxlAhbOfQ/T8rfaKU+KE+dwWV7Zi6ybcxKEwyyWmsY5UjpnMbV3OYaRUr/Ngo9ByBwXpS5vLI+2TIpy4KAuioNVIqt5XgLhoWbUfqS52VVEiEWUKKU/ef3A1N5MBkStKDeLeU9QQEFlHv/1opg2Vd7Wk2TrdWd4/o7lwLHl+IDWXvL4uemtJwjbaJA8ymjhvPJhZVkxCdFRGZNtYwuYhNFPDj9v6E0qd1bodMLbvdXIg+hRiPCIuHbsYo8i3zgekZGdGsVfPDt8AAVIqqPyUsQNeXalqm+FrFFzXyz3VcdaFNmHLpgAXlb/kKwPgiWxdOBoRRfkUdIyxqXzQnc8f/iVncNVc4/pPF5uPU9l9IGm5yjcsI+x+448II+Hy8v9DGr6qRq9LulZuvE+X5atJKVOG8Y8W108eNO6j1Zf3h0TpwFLNnBQap/WofXefRB0j23gyhPIuYrdYenKrYRUB/QzcQM2cwb2nAdabZ8m854RUCyblgzPmxFDHhgcZpumHSDFg4d7Eob6mUFZjXQIZ47pCK1KwroauUItb5uq0Nxje+l7gArsh4bsjpBiqJclZvm8oSED4q8yNqZI9E6JKhI/mXBBnHVa+5lv/Yg7mVAq12noZ+mCYxf0eXYWFtI3UfvcXv5FxX/ixeiDPMW7vkptL6cWl02amKjnbKssR/qwdihmQfvKD/A/tHV/eJ9YfLR1MfhETwv5cWN+zeG30wE6+dQ81UE/C1A+eX8zfGR6dF8DQGecVeLDCn0sa1hsqf9/zn1Mo6dGxfnz4FnOY3zk9hqz8Ndlqtw+SgpVL28xtjYv8g8MMuMHSfm0NPqPtlppLwujD4C2oJOE6Yce9hz6L0SSS8FM+X68uhkKug9yaqPrQQ8o/NB9WtkZyOu/7u1tNO9VqxVxsQlWsQ9ehCWNy2si94v/zkErbX3ZjFPKk4qPcrszi2gnGz+aZ1h/Q+aHz9tAdhFWwAYaiTOh1TqeXv8wf+qf5gUepJinDD4hOVfUjmYPNYCt3UIFmgo8tX7hnjtGzFmvtbXgY/5WpponodvRyCMIZZiaEuprkRosKBsDgED7Iwnbxx+/iftiokT+tXP4Qt3QA6yLYWpeo5/LLxTWRIOzj1mth9paDl6fsg0bwXRuvy387dr6StTc2ivgb5XCf+bLFzxTovj4fFz7Tchr97eiT7PAvhO4HJRUs4uoXSs2ms/pNT0J7gyvzRxOQ7RcSzcXC75PXxItywbl63h5Z9yrgAYJqWEw+ORsLzeOlcFLdjQS2/I9Q38Of1kfQul1Ws+zKGtjFdP17ZIF21+E1NW+sBmZ+lXOJ2Rpuxh33/Q9pnNUXYt9JK8daH5TOTdoONgusZ3Ob0YPRtZEF7CquPF0SKklz3PgYsnBCqqZA+hTEzRX3oXtpZhJoO4f+tsJBW8wm+qo16in/rd9wkJKTzLpVm9I0HajjUCKAJIsU1B4tMN7t6sFPiGAIDTFgJUSSFoTAQyboslTn4Yc9/F9kglBhtp0uky7zMcJGR8vdTeg8RH6a+iByf5ia35+lddKF76nAQmjjqVB7kA/oTC6ff8JPq8qAYLJKRChp+R3/e8ScrknyKRF68arYQ1Gt0zxYXl+4i06Jadagf5pdjxefaiXR3g7ZAjFznpd6o3ZgR1U6P6cjrTkquSaifj4C2q1iC+HqqUhrWA/12wJr6JRmd3cDjb8EZM8ynshOdRLOZSBjYqa9z9k2JKD5XwRHtzKUo8ccfVDjzGHzMM5O18ginzLPJP1+kF7eiHyjxqmQWdCWakW04975aGrVtWq98oBvoO7yDS0yDwz0r+Wb+zjaz9RCsoY7G+F+y42rLolJRW+p/NpbOYULa+Lx3Zwm7vkOoNEOkynN8IS0H4rbHP3TUhUCM1HxByV6F8NuyFOjCak48j0eY3+/viIqfxEuqiehlCS/tYfh9I6JiY0rkiZcj9brboSyvHxhqYNDndCu/yOXP0tBJ3uLR9hGI9tuE82ZSAm+s4X4Ny3zvLat47XUA6Bshvz605JhNkVSHJZ3TwGFM7vf/7cAk+BJWiM4KPAypUrR0M3pTRFX5WHrXudTQDE2A6CwosbD09Buu/FnN30nAkO9ggcY72CPV2NaynV32ES9nl6mLHkffhdXGFsxmGDP3oRsj+1pdeEkVon+KtNp8bZ3cGO1Fk+SeNfiGyY65D3uiT6Gw6bA0wQFV2BpqQNAsqQGFnT9tt+VQ0LmOUME+rBqBXxFp9JA/+caXVUruU6JmYj4kIIeK9+c6VXOeBgUD5xgr4PSK6MeWnahIfuaeRiRxmNLVAZ5UGdNzbWnUjLUa2z/En2Dal2yffe/HEqpv0mi1sQv4SlO8l9G7zJ+Y/JYgU4QeBrcuJKszfjtPIRZV3PkJCfC1mTTceusF/jJePCpILymd0eG9boeRtyuU2ZCQbHWDUawYbQW8z1mwTF7vBgurcJSkZBUCcvyzbNBp/5A6a1MfgAybTsoOafqR0KkmF412NN5H1z6Du0NLZAWnAq9sQlu5Rj/uzWtwofKGuX27Omrqri2wxXYqqJTAsruQe7Mzhh1cU9QrvQAUpcAAP3g0EBc1c/tSSlRYIPpb9U82kabrM3f7hwqiKUsfKQNj1QYzHqBd2VS9R47Lgwftv0dwKY9IRxI7WqPENDaav6r4okHWq4p+Ork7ZGL+VlFqOXVU0Pw1Kcwhzzv9/foBDs4sGHuljTlqqhCnoKCD1tlAaB2mQNy2UEoLT3zosceo3Dt60clS2/jmT0L1QoCCAXFwZcyfpqN6x92nvgqKQbvU06diEXU75onkqN9KIEj3EmWY/tojOZYQ0+gcn2BF55p8rNMvqxwXUla61TREizdt1tCyMsk0Gw7Qg662g6RM2CZ6x0OD2lSPYHVHUSFzFvXct1uAAd2dhXhqEFS/QAQNLSlNlXwgT8R7oB6B2vsEOvECIn3aTJBqQ+eLbdWgaxwVe7wUnuetkHXJl0eyjtDfb5aUKaOq2WGVBa9CSz+ali/5LtHdCaGuDz6hhmfY5N7DaoeyACD/y5J1e593LDkJXjD7sK0p+32qh8+83CrL1367emMOnoXENiFZ0Q9xGLDaGyGmabSq3BrzxKfvlyL4sKoPlTKlaKOb1QH0cTRKD0ok7OUruTNy1md46HYYwL96pGWgMouKXKdnOx8j+bF+0tDXUrYDaZ4npADBFcric0FAbO06Yh0n7qBSwZ2X5CbxAVum8vqOlmvJoNa90hMZKbNOXoApcKTxnQl8hH9pjealocBZ3mvjq11izRVYs8MIzpX+O9J2Rdex8FYsWbk16bLhRo/xeMwfiVDga2DyN7WLRghHuDqlvFarfdy9DsHcUYHJFCc2BA4ByS1mhR3sgbZSZqq0Kodm62JkYN+dp1o+IvB9X0oIWS8PHmFv5dS6lLug0t8RPeUt34BchYa1G/80Sixf3S4T89nEq7uUkNMqnKQw3EU+Y/Kvv3fgsVdscZ+mbm/kGu/ycnyYR38rmjQ4skS3NkLWM+qGzkP54mDhfZAjbmrcF04J4rmz4UZqzgOl42f/3jsIpOnnC3z+qM0tp802pSAwU/QXlR3Gy7HtOmnNl/d7/qOt0YAtyGFxw0LXinAPXyXwIAb4XxuZYCLSZeUQc9J+1KAy/qcs+yoKT+iuaHJig+T7FwXnuLOhGjv2UvGZ+5h6V8qB+BjALAITmEjAcvZQB9nOBpu3IxB9dt6wkFO6KOdEjZYX/GN17QPVV5AMUk1+3zKB0UJ0iTdnqFJ9WaDqjVH1PhRnwt9FsIIiplfpBvLatqMGO8N4S2iLrAsaaHyZjeJWkHfhRX+eodtNbU0m9X/ZqD6gJdx0QgZrcTngP3uJ+PYJuBIKIYfboKmLDZvJT0go6K++Y6rSw4J1anjBz1hnuOa4wUT24d0AH1VbWD4OWZ64/2yphQHoPOwXTn7QSUTAMOCBYEH717nMmAAu/VOxdLrPcNNsO/r1xMI9j7MRN+OpU9ticufqZrTsI7/5+RNEMqjvhU5LSLGYaKixIAwLrPQadXelzLnqAJqO06VylQb8ZJV5V7raNra/EmSThHjmf+8mi/34qS3w0o2wSeLoL+7qiUMGSQ2xNPZ7tlJGr32ri95hPJK7Yz+qzyjrKCyYQSt1hE7XbmkLljmYLbhnsQcpwEZm3E7YwuEp0hlpzzt3aDM17kNayBWHIWt9iSsT5NTbHQXtfhcGeFFtpBpxP8WrYhu6f07f4VsKb9DSHjHGv39xVaGAEQ+m+oQylm/gpqPb9155CASt7mYSTTJU3dnNe3p9BfEMV/XS4MlGFrUddgt9XzXtpM5H1alKrIlmcmeZ1HD7s9RLBC0Vu8igUv6W/r1B2suhSB5+OaQbK7W0Dp2P9P6RTXE0WXlj0zglfbcMtdwXNtNq5Ds9fiYs8drLmsLDY4ujDY2WnMSFM1Gg7Jpm4Eo0SRTH69MpRXkCWYjrjlvB/Q6MB/H8P2mjaevkaMTNCMKN1uxd6SxKqU8KWBV7xNhaf0tje/WHVojl/qV+SnGR8ZMBi0OVcYJzvQ3h8QG+yDtmyzwDpu6nLrAqnHvzbyoO6XZne3VjtKNPDAhlaSMsLLIU/TbJYqJjdPaaItW7+ENFxaBdmMTkqW5m2qoO0yqziDOHTJn0565tpHXH3+J6hXc8hEYJCkA2aD36TVrzfwQfuN12ZlbHE7o70WQw7sM6vnFvTEsnJPGUVDdZatdteGCyXKqeyzr5aZmJMiwtMb/jNCj70lkde2+5B0k+L5HwnIQQgcAqrM9I0Uy1pmLpeOLnvVVn3+U26esUPnfZ2Gto0R/I3YtSE+nS+GcMfa2j9Br2MAeCDO5LiXRJbG7z9EcR796ut0L/IDDUfUzXIYMr8PXHf9EaT6amK6RmycP7KRqGP32KiKaTKN/VRKvI7qvj77svRmytcV7wqb8e/wdPSRffsgqgH2E1QqG7bWceDw4KvHtazTAliphBDJevFX4o8SIJyD8NWebzbzNsok/qgTeW8u/1zBXEa8twesHuvD0ihp3LRYKqXGn46a5t9LGrGQApfOjvNMJjWDo0S2HLBrx683O8cTTs+J2EaYoCuv4KvKZORSw2bRaLQBOAjnIXs3JMk3EI5dttvAMZXraXRIpBabfjn+jqPCJ7TNa7RdxEi2z45oeSXbFvLFBGH8DRStuEGz/Rc57jy7nEdJHRqpenMTygrQpLvtbiWM1TkwCq1a2Z/iDIy3Z3hMLHS64f6aFbEdVNbzwIoO36iCgoBi6Q8ahtAtdwXCS6RlVPudOXGeuQugTaV+9ro62MwVsOYw+sBnaZ8PLGWb0HM4QW76ccG9/ZWSdVqpLgjQldagjcFLcKqGnlSJGV3CGsko72ynS0oNq+L0fSZ+jsNZB1bL2M7QYU9MQh5dXtU1KRP5uS2mIxsX+1hcfPwwc93c5CW3fJUoCkFy1/QS0wogXVjdKk9aO6TcYjhuBNt7jvYO2W3Dz2o8iTGRk3SEhJBrJJV5VhhpxO6faMBTTEOEQLyzI/d+cf1twR/alSd0WHCIBOL7yZrsyVhbrnoykpv0QqhCj4AJ0QEz8QBnNgmwQQ/IW0VBi6V8YXIMIkcx4pDJvhHzZ2ELUwGP4IcFNniygASsANV/rX/tRyLeOiYV3XhBqzC6LYrTdB+2YJIWlVJZSrsZypEg2UjOW2IMhZL9tTmab1LUfoAA6KYe58sg+FUigDIJS9yDLw6U+JuHbCMOE8gPRGR41n9TcPdkQBON5AR+Fcoo8ECPNgSFs9HE864bNTNhNZJ/4UjpwfSexKyO2vchkqE7ZdOuibaFBXyFZH+r1F7e7X7Vncoxx6LODtO6h9mE6iHc0t6zw5ppBK8sN+XdUGX0dSD3WYtpL5qVRClHs7FN8O6/OJM6bfRxlGcnIOOeCLG88Zgf9yn0tIH6zw6aJs/L7dveDPVaY9U4DWZMf+6b1+vMDPNoSLyKL8KEBzpxUlv2CJCl3/3DaK7sF4BKr48oWroNLSwhfNZB5P3++m1Tyc0bsh4axbf9o3vqwzMzoo368TA/1ZzVkdE+XjvFGr81eyl4mGLIhCBahI6826jwxAfsT2hJQ447cV44V1CcLBSGbG6qHbI3LXuFbqdlBs/y57/2u1a3IUXuCLB612SkvPicdUCPsQZvyykXQsoGUSt4wP/l+P53f/28CFlPTCWQE2aotz8wrF+p4Se2me1EEzsDHfFJt526hcRl7jIK1A9YfLnX0sUA5pCr6uy4wzKgQc7Yp3oNC4bzvrzxXrSSMmSivm7Md69hoiBgcDSBSZvH9/W0mjlD9oPJVHNZa84j8SIWP0pVGZFjO27yEgSQ5nwyQwW8r/WzmSMTZ8SomCOQirjca6iWe/Vo0PmvNRjifKN9EZcYvcIn1vQVhKPurdXHZXoSPGOpgx5CX3KodTrsoaUEtoQJJd4RBxfk57Djw8hGop6L25vTpAzVKMhkKYRf5jFSCD6qWs5VI3JSxAxQ0uRIZUfuHC6Pi0veaT5QKmyh8EtZD9WqILybG+bWz4yCMFDVImjtrHtjDYjXAJ3iPkphlMwY/vDGmilxcm5im6SKjgwtIL0nddbpYwdo8afslVJYiS3jALQjUkpoPhKl8tC01yHnrlQiqlQ5WZTw6FToMnFw7HDR/ekOFcH3OJwtNX/S85WjUDxq7PxZdh8fvSS2jkRN+gC46ZNyO8tIeSvo5ufz2yuKllF4JfdtEqWRKXAFDz9DpWEKip5qYF0LHhiYT+RhNgkiu9X5Nl62l1wALP7xgq5VpRpjKP08FydFIxSpN5pK6U09Xw24TDpvKOZTRhJJ/B7Pl6ig4KSqzB1kxzP4PbvLpsFS+KFMwZTWmXvqqmZv3WymFybpR1Dth+NU5P4WA3amVH10BMpn5l3ECXzEE05cQWCKmIsdh7iw41tnyEYxqGjBgJe1vpailXR75NvitQBk0icaiZTMgGBY2uGCZTl8ywMOOyUvIHF0njzwY08zIkNZ40GA047Df28mjmt40Gqj6TervR3y4t5YVG/6kWlASNegO/ki2JbOXdoSajYnxZ1rQwzRE3MWZXcGdNx44w6qJCT1C/aUJvqIatFsgWB6J9QI2CwHH3fcrhVqHqX8T8lbrIQRKwDGJ5xHxwAAAHFpJ9B2Hpt5mSXqfgAk6x8sfwG5eBbr0pUE0OubUu2bQUtQOFGazyStse5UfYlo/f3xHMLBkG+goK4NHTtcKqwn5k+sePQtwTanhjc4olfv0D4yltZmmEyH1/z9/DkFa0Ti/N1LfphYkosc15CxbXSvKutXly/+qx6hNiHwQzJjUnferb2Ns8zMt5UEd5WOEHzjYPdhF9YTxjHE8h6xBLNDA17ChjmcUKjWqeNAYsCtpBXNHI/cjzgXhZQi51obQOt+NUrZ6Sg4axyxzhV21m4+mFqIlG4ToNsW/LhYcWQj1WJwuPVvF+IDPa+9Ua1LwKov1TrA6UzxPMxZIf3m/BQFbtHEhBLDx2YdxQYtSB5/jYTbr7z/+H1dXCyRKz7tyHC+D6pOvs3Gn+XZdxuIZ1TyhKQ9e8gB1UDlMMNx734G6B6/qldB919/SediiXG/bxTH7sR1T8ipo7CteesL1foNRb/caVVyvY74pYgxNNsAHcYu1Khp1Yul7fgxpt9hvYMa16OjrePQ5U1UKsYpQI35c02ZgeYd+lk3S8iLQVjaJfrJ0ZNvRiInIiKU4f4UB7m+7mT009BTyuYVAQZFQJznSrD9jwTSGYlsSaHdsvXSHBASxsflODik9Qvwns1BCl+/wlms9UJt1SzuqyXbyFHSXmDxqCqmPHxo3WFWpKB08ISCE8Xa4Kr+fLP3hm2/pwdikOKO9Owdx4cp44hOFVuW/cNRpBYl5gAI25dcVxcRMlbbeIkVoA2gA2/r40U3tQAAAAAAAAAAAAA";

const LEGACY_TEAMS_KEY = "vb-teams";
const LEGACY_MATCHES_KEY = "vb-matches";
const SEASONS_KEY = "vb-seasons";
const CURRENT_SEASON_KEY = "vb-current-season";

const teamsKey = (seasonId) => `vb-teams-${seasonId}`;
const matchesKey = (seasonId) => `vb-matches-${seasonId}`;
const venuesKey = (seasonId) => `vb-venues-${seasonId}`;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
  } catch (e) {
    return iso;
  }
}

function setWinner(set) {
  if (set.home === "" || set.away === "" || set.home == null || set.away == null) return null;
  const h = Number(set.home), a = Number(set.away);
  if (Number.isNaN(h) || Number.isNaN(a) || h === a) return null;
  if (Math.abs(h - a) < 2) return null; // set musi być wygrany różnicą min. 2 punktów, jak w siatkówce
  return h > a ? "home" : "away";
}

// Zwraca true, gdy oba wyniki seta są wpisane, ale różnica jest mniejsza niż 2 punkty —
// taki set jest nieprawidłowy i nie liczy się do wyniku meczu, dopóki nie zostanie poprawiony.
function setInvalid(set) {
  if (set.home === "" || set.away === "" || set.home == null || set.away == null) return false;
  const h = Number(set.home), a = Number(set.away);
  if (Number.isNaN(h) || Number.isNaN(a)) return false;
  return Math.abs(h - a) < 2;
}

function matchOutcome(match) {
  let homeSets = 0, awaySets = 0, homePts = 0, awayPts = 0;
  for (const s of match.sets || []) {
    const w = setWinner(s);
    if (w === "home") homeSets++;
    if (w === "away") awaySets++;
    if (w) {
      homePts += Number(s.home);
      awayPts += Number(s.away);
    }
  }
  const played = homeSets >= 3 || awaySets >= 3;
  let winner = null, leaguePts = null;
  if (played) {
    winner = homeSets >= 3 ? "home" : "away";
    const tight = homeSets + awaySets === 5;
    leaguePts = tight
      ? { home: winner === "home" ? 2 : 1, away: winner === "away" ? 2 : 1 }
      : { home: winner === "home" ? 3 : 0, away: winner === "away" ? 3 : 0 };
  }
  return { homeSets, awaySets, homePts, awayPts, played, winner, leaguePts };
}

function computeStandings(teams, matches) {
  const table = {};
  for (const t of teams) {
    table[t.id] = { id: t.id, name: t.name, mp: 0, w: 0, l: 0, setsW: 0, setsL: 0, ptsW: 0, ptsL: 0, pts: 0 };
  }
  for (const m of matches) {
    const o = matchOutcome(m);
    if (!o.played || !table[m.homeId] || !table[m.awayId]) continue;
    const home = table[m.homeId], away = table[m.awayId];
    home.mp++; away.mp++;
    home.setsW += o.homeSets; home.setsL += o.awaySets;
    away.setsW += o.awaySets; away.setsL += o.homeSets;
    home.ptsW += o.homePts; home.ptsL += o.awayPts;
    away.ptsW += o.awayPts; away.ptsL += o.homePts;
    home.pts += o.leaguePts.home; away.pts += o.leaguePts.away;
    if (o.winner === "home") { home.w++; away.l++; } else { away.w++; home.l++; }
  }
  return Object.values(table).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const ra = a.setsL === 0 ? a.setsW : a.setsW / a.setsL;
    const rb = b.setsL === 0 ? b.setsW : b.setsW / b.setsL;
    if (rb !== ra) return rb - ra;
    const pa = a.ptsL === 0 ? a.ptsW : a.ptsW / a.ptsL;
    const pb = b.ptsL === 0 ? b.ptsW : b.ptsW / b.ptsL;
    return pb - pa;
  });
}

// Wykrywa mecze, które kolidują ze sobą: ta sama data + godzina + hala.
// Zwraca mapę matchId -> lista ID meczów, z którymi dany mecz koliduje (fizycznie niemożliwe:
// dwa mecze nie mogą się jednocześnie rozgrywać na tej samej hali).
function findVenueConflicts(matches) {
  const groups = {};
  for (const m of matches) {
    const date = (m.date || "").trim();
    const time = (m.time || "").trim();
    const venue = (m.venue || "").trim().toLowerCase();
    if (!date || !time || !venue) continue;
    const key = `${date}|${time}|${venue}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m.id);
  }
  const conflicts = {};
  for (const ids of Object.values(groups)) {
    if (ids.length > 1) {
      for (const id of ids) conflicts[id] = ids.filter((x) => x !== id);
    }
  }
  return conflicts;
}

// Metoda kołowa: każda drużyna gra z każdą raz (lub dwa razy przy rundzie podwójnej),
// nigdy dwa mecze tej samej drużyny w tej samej kolejce.
function generateRoundRobin(teamIds, doubleRound) {
  let arr = [...teamIds];
  if (arr.length % 2 !== 0) arr.push(null); // "wolny los" przy nieparzystej liczbie drużyn
  const n = arr.length;
  const roundsCount = n - 1;
  const rounds = [];
  for (let r = 0; r < roundsCount; r++) {
    const roundMatches = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i];
      if (a !== null && b !== null) {
        roundMatches.push(r % 2 === 0 ? { home: a, away: b } : { home: b, away: a });
      }
    }
    rounds.push(roundMatches);
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }
  if (doubleRound) {
    const secondLeg = rounds.map((rm) => rm.map((m) => ({ home: m.away, away: m.home })));
    return [...rounds, ...secondLeg];
  }
  return rounds;
}

// Rozkłada kolejki na podane terminy (data + konkretne sloty godzinowe, każdy z przypisaną halą
// wybraną z listy hal zdefiniowanych dla sezonu).
// Kolejka może zostać rozbita na kilka dat, ale nigdy nie miesza dwóch kolejek w jednej dacie,
// więc żadna drużyna nie zagra dwa razy tego samego dnia.
// Mecze, dla których zabraknie wolnych slotów, trafiają do puli nierozplanowanych.
function assignToDates(rounds, dateRows) {
  const rows = dateRows.map((r) => ({
    date: r.date,
    pool: [...r.slots],
  }));
  const scheduled = [];
  let rowIdx = 0;
  let unscheduled = 0;

  function advance() {
    while (rowIdx < rows.length) {
      if (rows[rowIdx].pool.length > 0) return true;
      rowIdx++;
    }
    return false;
  }

  for (let r = 0; r < rounds.length; r++) {
    let remaining = [...rounds[r]];
    while (remaining.length > 0) {
      if (!advance()) { unscheduled += remaining.length; break; }
      const row = rows[rowIdx];
      const slot = row.pool.shift();
      const m = remaining.shift();
      scheduled.push({
        home: m.home,
        away: m.away,
        round: r + 1,
        date: row.date,
        time: slot.time || "",
        venue: slot.venue || "",
      });
    }
  }
  return { scheduled, unscheduled };
}

export default function VolleyballLeagueApp() {
  const [tab, setTab] = useState("tabela");
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [venues, setVenues] = useState([]);
  const [newVenueName, setNewVenueName] = useState("");
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);

  const [seasons, setSeasons] = useState([]);
  const [currentSeasonId, setCurrentSeasonId] = useState(null); // domyślny sezon widoczny dla kibiców
  const [selectedSeasonId, setSelectedSeasonId] = useState(null); // sezon aktualnie przeglądany/edytowany
  const [newSeasonName, setNewSeasonName] = useState("");
  const [copySeasonSource, setCopySeasonSource] = useState("");
  const [seasonError, setSeasonError] = useState("");
  const [confirmDeleteSeasonId, setConfirmDeleteSeasonId] = useState(null);

  const [adminPasswordExists, setAdminPasswordExists] = useState(null); // null=unknown
  const [unlocked, setUnlocked] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [passInput2, setPassInput2] = useState("");
  const [passError, setPassError] = useState("");

  const [newTeamName, setNewTeamName] = useState("");
  const [newMatch, setNewMatch] = useState({ round: "1", date: "", time: "", venue: "", homeId: "", awayId: "" });

  const [dateRows, setDateRows] = useState([{ id: uid(), date: "", slots: [{ id: uid(), time: "", venue: "" }] }]);
  const [roundMode, setRoundMode] = useState("single");
  const [genPreview, setGenPreview] = useState(null);
  const [genError, setGenError] = useState("");
  const [printMatchId, setPrintMatchId] = useState(null);
  const [posterOpen, setPosterOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let seasonList = [];
        try {
          const r = await storage.get(SEASONS_KEY);
          if (r) seasonList = JSON.parse(r.value);
        } catch (e) { /* brak sezonów jeszcze */ }

        let curId = null;
        try {
          const r = await storage.get(CURRENT_SEASON_KEY);
          if (r) curId = r.value;
        } catch (e) { /* brak ustawionego domyślnego sezonu */ }

        if (seasonList.length === 0) {
          // migracja starych, niesezonowych danych (jeśli istniały) do pierwszego sezonu
          let legacyTeams = null, legacyMatches = null;
          try {
            const r = await storage.get(LEGACY_TEAMS_KEY);
            if (r) legacyTeams = JSON.parse(r.value);
          } catch (e) { /* brak */ }
          try {
            const r = await storage.get(LEGACY_MATCHES_KEY);
            if (r) legacyMatches = JSON.parse(r.value);
          } catch (e) { /* brak */ }

          const firstId = uid();
          await storage.set(teamsKey(firstId), JSON.stringify(legacyTeams || []));
          await storage.set(matchesKey(firstId), JSON.stringify(legacyMatches || []));
          await storage.set(venuesKey(firstId), JSON.stringify([{ id: uid(), name: "Hala 1" }]));
          seasonList = [{ id: firstId, name: "Sezon 1", createdAt: Date.now() }];
          curId = firstId;
          await storage.set(SEASONS_KEY, JSON.stringify(seasonList));
          await storage.set(CURRENT_SEASON_KEY, curId);
        } else if (!curId || !seasonList.find((s) => s.id === curId)) {
          curId = seasonList[0].id;
          await storage.set(CURRENT_SEASON_KEY, curId);
        }

        setSeasons(seasonList);
        setCurrentSeasonId(curId);
        setSelectedSeasonId(curId);

        let t = [], m = [];
        try {
          const r = await storage.get(teamsKey(curId));
          if (r) t = JSON.parse(r.value);
        } catch (e) { /* brak drużyn */ }
        try {
          const r = await storage.get(matchesKey(curId));
          if (r) m = JSON.parse(r.value);
        } catch (e) { /* brak meczów */ }
        let v = [];
        try {
          const r = await storage.get(venuesKey(curId));
          if (r) v = JSON.parse(r.value);
        } catch (e) { /* brak hal */ }
        setTeams(t);
        setMatches(m);
        setVenues(v);

        try {
          const exists = await adminAuth.passwordExists();
          setAdminPasswordExists(exists);
        } catch (e) {
          setAdminPasswordExists(false);
        }
      } catch (e) {
        setStorageError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function switchSeason(id) {
    setSelectedSeasonId(id);
    let t = [], m = [], v = [];
    try {
      const r = await storage.get(teamsKey(id));
      if (r) t = JSON.parse(r.value);
    } catch (e) { /* brak drużyn */ }
    try {
      const r = await storage.get(matchesKey(id));
      if (r) m = JSON.parse(r.value);
    } catch (e) { /* brak meczów */ }
    try {
      const r = await storage.get(venuesKey(id));
      if (r) v = JSON.parse(r.value);
    } catch (e) { /* brak hal */ }
    setTeams(t);
    setMatches(m);
    setVenues(v);
    setHala2Name("");
  }

  async function createSeason() {
    setSeasonError("");
    const name = newSeasonName.trim();
    if (!name) { setSeasonError("Podaj nazwę sezonu, np. 2027/2028."); return; }
    try {
      const id = uid();
      let newTeams = [];
      let newVenues = [{ id: uid(), name: "Hala 1" }];
      if (copySeasonSource) {
        try {
          const r = await storage.get(teamsKey(copySeasonSource));
          if (r) newTeams = JSON.parse(r.value).map((t) => ({ id: uid(), name: t.name }));
        } catch (e) { /* brak drużyn do skopiowania */ }
        try {
          const r = await storage.get(venuesKey(copySeasonSource));
          if (r) newVenues = JSON.parse(r.value).map((v) => ({ id: uid(), name: v.name }));
        } catch (e) { /* brak hal do skopiowania */ }
      }
      await storage.set(teamsKey(id), JSON.stringify(newTeams));
      await storage.set(matchesKey(id), JSON.stringify([]));
      await storage.set(venuesKey(id), JSON.stringify(newVenues));
      const nextSeasons = [...seasons, { id, name, createdAt: Date.now() }];
      await storage.set(SEASONS_KEY, JSON.stringify(nextSeasons));
      setSeasons(nextSeasons);
      setNewSeasonName("");
      setCopySeasonSource("");
      await switchSeason(id);
    } catch (e) {
      setSeasonError("Nie udało się utworzyć sezonu. Spróbuj ponownie.");
    }
  }

  async function setAsCurrentSeason(id) {
    setCurrentSeasonId(id);
    try { await storage.set(CURRENT_SEASON_KEY, id); } catch (e) { setStorageError(true); }
  }

  async function deleteSeason(id) {
    if (seasons.length <= 1) return;
    const nextSeasons = seasons.filter((s) => s.id !== id);
    setSeasons(nextSeasons);
    setConfirmDeleteSeasonId(null);
    try { await storage.set(SEASONS_KEY, JSON.stringify(nextSeasons)); } catch (e) { /* ignore */ }
    try { await storage.delete(teamsKey(id)); } catch (e) { /* ignore */ }
    try { await storage.delete(matchesKey(id)); } catch (e) { /* ignore */ }
    try { await storage.delete(venuesKey(id)); } catch (e) { /* ignore */ }
    if (id === currentSeasonId) await setAsCurrentSeason(nextSeasons[0].id);
    if (id === selectedSeasonId) await switchSeason(nextSeasons[0].id);
  }

  const saveTeams = useCallback(async (next) => {
    setTeams(next);
    if (!selectedSeasonId) return;
    try { await storage.set(teamsKey(selectedSeasonId), JSON.stringify(next)); } catch (e) { setStorageError(true); }
  }, [selectedSeasonId]);

  const saveMatches = useCallback(async (next) => {
    setMatches(next);
    if (!selectedSeasonId) return;
    try { await storage.set(matchesKey(selectedSeasonId), JSON.stringify(next)); } catch (e) { setStorageError(true); }
  }, [selectedSeasonId]);

  const saveVenues = useCallback(async (next) => {
    setVenues(next);
    if (!selectedSeasonId) return;
    try { await storage.set(venuesKey(selectedSeasonId), JSON.stringify(next)); } catch (e) { setStorageError(true); }
  }, [selectedSeasonId]);

  function addTeam() {
    const name = newTeamName.trim();
    if (!name) return;
    saveTeams([...teams, { id: uid(), name }]);
    setNewTeamName("");
  }

  function deleteTeam(id) {
    saveTeams(teams.filter((t) => t.id !== id));
    saveMatches(matches.filter((m) => m.homeId !== id && m.awayId !== id));
  }

  function addVenue() {
    const name = newVenueName.trim();
    if (!name) return;
    if (venues.some((v) => v.name.toLowerCase() === name.toLowerCase())) { setNewVenueName(""); return; }
    saveVenues([...venues, { id: uid(), name }]);
    setNewVenueName("");
  }

  function deleteVenue(id) {
    saveVenues(venues.filter((v) => v.id !== id));
  }

  function addMatch() {
    if (!newMatch.homeId || !newMatch.awayId || newMatch.homeId === newMatch.awayId) return;
    const match = {
      id: uid(),
      round: newMatch.round || "1",
      date: newMatch.date,
      time: newMatch.time,
      venue: newMatch.venue,
      homeId: newMatch.homeId,
      awayId: newMatch.awayId,
      sets: [],
    };
    saveMatches([...matches, match]);
    setNewMatch({ round: newMatch.round, date: "", time: "", venue: "", homeId: "", awayId: "" });
  }

  function deleteMatch(id) {
    saveMatches(matches.filter((m) => m.id !== id));
  }

  function updateMatchField(matchId, field, value) {
    const next = matches.map((m) => (m.id === matchId ? { ...m, [field]: value } : m));
    saveMatches(next);
  }

  function updateSet(matchId, setIndex, side, value) {
    const clean = value === "" ? "" : value.replace(/[^0-9]/g, "");
    const next = matches.map((m) => {
      if (m.id !== matchId) return m;
      const sets = [...(m.sets || [])];
      while (sets.length <= setIndex) sets.push({ home: "", away: "" });
      sets[setIndex] = { ...sets[setIndex], [side]: clean };
      return { ...m, sets };
    });
    saveMatches(next);
  }

  function addDateRow() {
    setDateRows([...dateRows, { id: uid(), date: "", slots: [{ id: uid(), time: "", venue: venues[0]?.name || "" }] }]);
  }

  function duplicateDateRow(rowId) {
    setDateRows((prev) => {
      const idx = prev.findIndex((r) => r.id === rowId);
      if (idx === -1) return prev;
      const original = prev[idx];
      const copy = {
        id: uid(),
        date: "",
        slots: original.slots.map((s) => ({ id: uid(), time: s.time, venue: s.venue })),
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  function removeDateRow(id) {
    setDateRows(dateRows.filter((r) => r.id !== id));
  }

  function updateDateRowDate(id, value) {
    setDateRows(dateRows.map((r) => (r.id === id ? { ...r, date: value } : r)));
  }

  function addSlot(rowId) {
    setDateRows(dateRows.map((r) => (r.id === rowId ? { ...r, slots: [...r.slots, { id: uid(), time: "", venue: venues[0]?.name || "" }] } : r)));
  }

  function removeSlot(rowId, slotId) {
    setDateRows(dateRows.map((r) => (r.id === rowId ? { ...r, slots: r.slots.filter((s) => s.id !== slotId) } : r)));
  }

  function updateSlot(rowId, slotId, field, value) {
    setDateRows(dateRows.map((r) => (
      r.id === rowId ? { ...r, slots: r.slots.map((s) => (s.id === slotId ? { ...s, [field]: value } : s)) } : r
    )));
  }

  function handlePreviewGenerate() {
    setGenError("");
    setGenPreview(null);
    const teamIds = teams.map((t) => t.id);
    if (teamIds.length < 2) { setGenError("Potrzebujesz co najmniej 2 drużyn."); return; }
    if (venues.length === 0) { setGenError("Najpierw zdefiniuj przynajmniej jedną halę w sekcji „Hale”."); return; }
    const validRows = dateRows.filter((d) => d.date.trim() !== "" && d.slots.length > 0);
    if (validRows.length === 0) { setGenError("Dodaj co najmniej jeden termin z przynajmniej jednym slotem meczowym."); return; }
    const defaultVenueName = venues[0]?.name || "";
    const rounds = generateRoundRobin(teamIds, roundMode === "double");
    const totalMatches = rounds.reduce((s, r) => s + r.length, 0);
    const rowsForAssign = validRows.map((r) => ({ date: r.date.trim(), slots: r.slots.map((s) => ({ time: s.time, venue: s.venue || defaultVenueName })) }));
    const { scheduled, unscheduled } = assignToDates(rounds, rowsForAssign);
    const conflictCount = Object.keys(findVenueConflicts(scheduled.map((m, i) => ({ ...m, id: String(i) })))).length;
    setGenPreview({ scheduled, unscheduledCount: unscheduled, totalMatches, roundsCount: rounds.length, conflictCount });
  }

  function handleConfirmGenerate() {
    if (!genPreview) return;
    const generated = genPreview.scheduled.map((m) => ({
      id: uid(), round: String(m.round), date: m.date, time: m.time, venue: m.venue, homeId: m.home, awayId: m.away, sets: [],
    }));
    saveMatches(generated);
    setGenPreview(null);
  }

  async function handleSetPassword() {
    setPassError("");
    if (passInput.length < 4) { setPassError("Hasło musi mieć min. 4 znaki."); return; }
    if (passInput !== passInput2) { setPassError("Hasła nie są identyczne."); return; }
    try {
      await adminAuth.setPassword(passInput);
      setAdminPasswordExists(true);
      setUnlocked(true);
      setPassInput(""); setPassInput2("");
    } catch (e) {
      setPassError("Nie udało się zapisać hasła. Spróbuj ponownie.");
    }
  }

  async function handleLogin() {
    setPassError("");
    try {
      const ok = await adminAuth.verifyPassword(passInput);
      if (ok) {
        setUnlocked(true);
        setPassInput("");
      } else {
        setPassError("Błędne hasło.");
      }
    } catch (e) {
      setPassError("Nie udało się sprawdzić hasła.");
    }
  }

  const teamName = (id) => teams.find((t) => t.id === id)?.name || "?";
  const standings = computeStandings(teams, matches);
  const venueConflicts = findVenueConflicts(matches);
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => Number(a) - Number(b));
  const activeRound = rounds.find((r) => matches.some((m) => m.round === r && !matchOutcome(m).played));

  if (loading) {
    return (
      <div className="vb-root" style={{ background: "var(--navy)", minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{FONT_STYLE}</style>
        <div style={{ color: "var(--chalk)", fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.05em" }}>WCZYTYWANIE...</div>
      </div>
    );
  }

  const currentSeasonName = seasons.find((s) => s.id === selectedSeasonId)?.name || "";
  const matchToPrint = matches.find((m) => m.id === printMatchId) || null;

  return (
    <div className="vb-root" style={{ background: "var(--chalk)", minHeight: 500 }}>
      <style>{FONT_STYLE}</style>

      <div id="vb-app-content">
      {/* Header */}
      <div className="vb-header">
        <div className="vb-header-top">
          <img src={LOGO_DATA_URI} alt="Towarzystwo Sportowe w Wągrowcu" className="vb-logo" />
          <span className="vb-display vb-title">LIGA SIATKÓWKI</span>
          {seasons.length > 0 ? (
            <select
              value={selectedSeasonId || ""}
              onChange={(e) => switchSeason(e.target.value)}
              style={{
                background: "var(--navy-2)", color: "var(--chalk)", border: "1px solid #2C4C5E", borderRadius: 4,
                padding: "4px 8px", fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", cursor: "pointer",
                maxWidth: "100%",
              }}
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.id === currentSeasonId ? " (aktualny)" : ""}</option>
              ))}
            </select>
          ) : (
            <span style={{ color: "var(--grey)", fontSize: 13 }}>sezon lokalny</span>
          )}
          {selectedSeasonId && selectedSeasonId !== currentSeasonId && (
            <span style={{ fontSize: 11, color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: 3, padding: "2px 6px" }}>
              Archiwum
            </span>
          )}
        </div>
        <div className="vb-tabs">
          {[
            { id: "tabela", label: "Tabela", icon: Trophy },
            { id: "terminarz", label: "Terminarz", icon: CalendarDays },
            { id: "admin", label: "Admin", icon: Lock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`vb-tab vb-tab-btn ${tab === id ? "active" : ""}`}
              style={{ color: tab === id ? "var(--amber)" : "var(--chalk)" }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="vb-content">
        {storageError && (
          <div style={{ background: "#F6E4DE", color: "var(--rust)", padding: "10px 14px", borderRadius: 4, marginBottom: 16, fontSize: 13 }}>
            Wystąpił problem z zapisem danych. Spróbuj odświeżyć stronę.
          </div>
        )}

        {tab === "tabela" && (
          <div>
            {standings.length === 0 ? (
              <EmptyState text="Brak drużyn. Dodaj drużyny w panelu Admin, żeby zobaczyć tabelę." />
            ) : (
              <div className="vb-standings-wrap">
                <table className="vb-standings-table">
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--navy)" }}>
                      {["#", "Drużyna", "M", "W", "P", "Sety", "Punkty", "Pkt lig."].map((h, i) => (
                        <th key={h} style={{
                          textAlign: i === 1 ? "left" : "center",
                          padding: "8px 10px",
                          fontSize: 12,
                          color: "var(--grey)",
                          fontWeight: 600,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, idx) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #DFD8C8", background: idx % 2 === 1 ? "#EAE5D9" : "transparent" }}>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <span className="vb-display" style={{ fontSize: 20, color: "var(--oak)" }}>{idx + 1}</span>
                        </td>
                        <td style={{ padding: "10px", fontWeight: 600 }}>{row.name}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>{row.mp}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>{row.w}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>{row.l}</td>
                        <td style={{ padding: "10px", textAlign: "center", color: "var(--grey)" }}>{row.setsW}:{row.setsL}</td>
                        <td style={{ padding: "10px", textAlign: "center", color: "var(--grey)" }}>{row.ptsW}:{row.ptsL}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <span className="vb-display" style={{ fontSize: 20, color: "var(--navy)" }}>{row.pts}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "terminarz" && (
          <div>
            {matches.length > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                <button onClick={() => setPosterOpen(true)} className="vb-btn" style={{
                  background: "var(--navy)", color: "var(--chalk)", display: "flex", alignItems: "center", gap: 6, fontSize: 13,
                }}>
                  <Printer size={14} /> Plakat terminarza
                </button>
              </div>
            )}
            {matches.length === 0 ? (
              <EmptyState text="Brak zaplanowanych meczów. Dodaj mecze w panelu Admin." />
            ) : (
              rounds.map((round) => (
                <div key={round} style={{ marginBottom: 22 }}>
                  <div className="vb-display" style={{ fontSize: 18, color: "var(--oak)", marginBottom: 8 }}>
                    KOLEJKA {round}
                  </div>
                  {matches
                    .filter((m) => m.round === round)
                    .slice()
                    .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                    .map((m) => {
                    const o = matchOutcome(m);
                    return (
                      <div key={m.id} className="vb-match-card">
                        <div className="vb-match-info">
                          <span style={{ fontSize: 12, color: "var(--grey)", minWidth: 150 }}>
                            {m.date ? formatDate(m.date) : ""}{m.time ? ` · ${m.time}` : ""}{m.venue ? ` · ${m.venue}` : ""}
                          </span>
                          <span style={{ fontWeight: o.winner === "home" ? 700 : 400 }}>{teamName(m.homeId)}</span>
                          <span style={{ color: "var(--grey)" }}>vs</span>
                          <span style={{ fontWeight: o.winner === "away" ? 700 : 400 }}>{teamName(m.awayId)}</span>
                        </div>
                        <div className="vb-match-actions">
                          {o.played ? (
                            <span className="vb-display" style={{ fontSize: 20, color: "var(--navy)" }}>
                              {o.homeSets} : {o.awaySets}
                            </span>
                          ) : (o.homeSets > 0 || o.awaySets > 0) ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span className="vb-display" style={{ fontSize: 20, color: "var(--navy)" }}>
                                {o.homeSets} : {o.awaySets}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--grey)", fontStyle: "italic" }}>w trakcie</span>
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--grey)", fontStyle: "italic" }}>do rozegrania</span>
                          )}
                          <button onClick={() => setPrintMatchId(m.id)} title="Drukuj protokół meczowy" style={{ background: "none", border: "1px solid #C9C2B3", borderRadius: 4, cursor: "pointer", color: "var(--navy)", display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "3px 7px" }}>
                            <Printer size={13} /> Protokół
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "admin" && !unlocked && (
          <div style={{ maxWidth: 340, margin: "40px auto", textAlign: "center" }}>
            {adminPasswordExists === false ? (
              <>
                <KeyRound size={28} color="var(--oak)" style={{ marginBottom: 10 }} />
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Ustaw hasło administratora</div>
                <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 14 }}>Będzie potrzebne do zarządzania drużynami i wynikami.</div>
                <input type="password" className="vb-input" placeholder="Nowe hasło" value={passInput}
                  onChange={(e) => setPassInput(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
                <input type="password" className="vb-input" placeholder="Powtórz hasło" value={passInput2}
                  onChange={(e) => setPassInput2(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
                {passError && <div style={{ color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>{passError}</div>}
                <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", width: "100%" }} onClick={handleSetPassword}>
                  Ustaw hasło i wejdź
                </button>
              </>
            ) : (
              <>
                <Lock size={28} color="var(--oak)" style={{ marginBottom: 10 }} />
                <div style={{ fontWeight: 600, marginBottom: 14 }}>Panel administratora</div>
                <input type="password" className="vb-input" placeholder="Hasło" value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={{ width: "100%", marginBottom: 10 }} />
                {passError && <div style={{ color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>{passError}</div>}
                <button className="vb-btn" style={{ background: "var(--navy)", color: "#fff", width: "100%" }} onClick={handleLogin}>
                  Wejdź
                </button>
              </>
            )}
          </div>
        )}

        {tab === "admin" && unlocked && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--oak)", marginBottom: 20, fontSize: 13 }}>
              <ShieldCheck size={16} /> Zalogowano jako administrator
            </div>

            {/* Season management */}
            <Section title="Sezony" defaultOpen>
              <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 12 }}>
                Każdy sezon ma osobne drużyny, hale i terminarz. „Aktualny” to sezon, który domyślnie widzą odwiedzający stronę — pozostałe zostają zarchiwizowane, ale możesz je przeglądać i edytować w dowolnej chwili z listy powyżej (przy logo).
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {seasons.map((s) => (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                    background: s.id === selectedSeasonId ? "#EAE5D9" : "#fff",
                    border: "1px solid #DFD8C8", borderRadius: 4, padding: "8px 10px",
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 13, flex: 1, minWidth: 100 }}>{s.name}</span>
                    {s.id === currentSeasonId && (
                      <span style={{ fontSize: 11, color: "var(--oak)", border: "1px solid var(--oak)", borderRadius: 3, padding: "2px 6px" }}>Aktualny</span>
                    )}
                    {s.id === selectedSeasonId && (
                      <span style={{ fontSize: 11, color: "var(--navy)", border: "1px solid var(--navy)", borderRadius: 3, padding: "2px 6px" }}>Przeglądasz</span>
                    )}
                    {s.id !== selectedSeasonId && (
                      <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)", fontSize: 12, padding: "4px 8px" }} onClick={() => switchSeason(s.id)}>
                        Przeglądaj / edytuj
                      </button>
                    )}
                    {s.id !== currentSeasonId && (
                      <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)", fontSize: 12, padding: "4px 8px" }} onClick={() => setAsCurrentSeason(s.id)}>
                        Ustaw jako aktualny
                      </button>
                    )}
                    {seasons.length > 1 && (
                      confirmDeleteSeasonId === s.id ? (
                        <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                          <span style={{ color: "var(--rust)" }}>Na pewno usunąć?</span>
                          <button className="vb-btn" style={{ background: "var(--rust)", color: "#fff", fontSize: 12, padding: "4px 8px" }} onClick={() => deleteSeason(s.id)}>
                            Tak, usuń
                          </button>
                          <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)", fontSize: 12, padding: "4px 8px" }} onClick={() => setConfirmDeleteSeasonId(null)}>
                            Anuluj
                          </button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDeleteSeasonId(s.id)} title="Usuń sezon" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                          <Trash2 size={14} />
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #DFD8C8", paddingTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Nowy sezon</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <input className="vb-input" placeholder="Nazwa sezonu, np. 2027/2028" value={newSeasonName}
                    onChange={(e) => setNewSeasonName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createSeason()}
                    style={{ flex: 1, minWidth: 160 }} />
                  <select className="vb-input" value={copySeasonSource} onChange={(e) => setCopySeasonSource(e.target.value)}>
                    <option value="">Bez kopiowania drużyn/hal</option>
                    {seasons.map((s) => <option key={s.id} value={s.id}>Kopiuj z: {s.name}</option>)}
                  </select>
                  <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 4 }} onClick={createSeason}>
                    <Plus size={15} /> Utwórz sezon
                  </button>
                </div>
                {seasonError && <div style={{ color: "var(--rust)", fontSize: 13, marginTop: 8 }}>{seasonError}</div>}
              </div>
            </Section>

            {/* Teams management */}
            <Section title="Drużyny">
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input className="vb-input" placeholder="Nazwa nowej drużyny" value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTeam()}
                  style={{ flex: 1 }} />
                <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 4 }} onClick={addTeam}>
                  <Plus size={15} /> Dodaj
                </button>
              </div>
              {teams.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--grey)" }}>Brak drużyn.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {teams.map((t) => (
                    <div key={t.id} style={{
                      display: "flex", alignItems: "center", gap: 8, background: "#fff",
                      border: "1px solid #DFD8C8", borderRadius: 4, padding: "6px 10px", fontSize: 13,
                    }}>
                      {t.name}
                      <button onClick={() => deleteTeam(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Venues management */}
            <Section title="Hale">
              <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 12 }}>
                Zdefiniuj hale dostępne w tym sezonie — potem wybierzesz je z listy przy ustalaniu terminarza, zamiast wpisywać nazwę za każdym razem.
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input className="vb-input" placeholder="Nazwa nowej hali" value={newVenueName}
                  onChange={(e) => setNewVenueName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addVenue()}
                  style={{ flex: 1, maxWidth: 240 }} />
                <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 4 }} onClick={addVenue}>
                  <Plus size={15} /> Dodaj
                </button>
              </div>
              {venues.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--rust)" }}>Brak zdefiniowanych hal — dodaj przynajmniej jedną, zanim wygenerujesz terminarz.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {venues.map((v) => (
                    <div key={v.id} style={{
                      display: "flex", alignItems: "center", gap: 8, background: "#fff",
                      border: "1px solid #DFD8C8", borderRadius: 4, padding: "6px 10px", fontSize: 13,
                    }}>
                      {v.name}
                      <button onClick={() => deleteVenue(v.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Auto schedule generator */}
            <Section title="Generator terminarza (automatyczny)">
              <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 12 }}>
                Wygeneruje mecze każdy z każdym i rozłoży je na podane terminy — dla każdej daty określ godziny i wybierz halę z listy zdefiniowanej w sekcji „Hale”. Żadna drużyna nie zagra dwa razy tego samego dnia.
              </div>

              <div style={{ display: "flex", gap: 18, marginBottom: 14, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="radio" checked={roundMode === "single"} onChange={() => setRoundMode("single")} />
                  Runda pojedyncza (każdy z każdym raz)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="radio" checked={roundMode === "double"} onChange={() => setRoundMode("double")} />
                  Runda podwójna (mecz i rewanż)
                </label>
              </div>

              <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {dateRows.map((row) => (
                  <div key={row.id} style={{ border: "1px solid #DFD8C8", background: "#fff", borderRadius: 4, padding: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                      <input className="vb-input" style={{ width: 155 }} type="date" value={row.date}
                        onChange={(e) => updateDateRowDate(row.id, e.target.value)} />
                      <span style={{ fontSize: 12, color: "var(--grey)" }}>{row.slots.length} slot(y) meczowe tego dnia</span>
                      <button onClick={() => duplicateDateRow(row.id)} title="Duplikuj ten dzień (te same sloty, nowa data)" style={{
                        background: "none", border: "1px solid #C9C2B3", borderRadius: 4, cursor: "pointer", color: "var(--navy)",
                        display: "flex", alignItems: "center", gap: 4, fontSize: 12, padding: "4px 8px", marginLeft: "auto",
                      }}>
                        <Copy size={13} /> Duplikuj dzień
                      </button>
                      {dateRows.length > 1 && (
                        <button onClick={() => removeDateRow(row.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 8 }}>
                      {row.slots.map((slot) => (
                        <div key={slot.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input className="vb-input" style={{ width: 100, padding: "4px 8px" }} type="time" value={slot.time}
                            onChange={(e) => updateSlot(row.id, slot.id, "time", e.target.value)} />
                          <select className="vb-input" style={{ width: 150, padding: "4px 8px" }}
                            value={slot.venue || (venues[0]?.name || "")}
                            onChange={(e) => updateSlot(row.id, slot.id, "venue", e.target.value)}>
                            {venues.length === 0 && <option value="">Brak zdefiniowanych hal</option>}
                            {venues.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                          </select>
                          {row.slots.length > 1 && (
                            <button onClick={() => removeSlot(row.id, slot.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button className="vb-btn" style={{ background: "none", border: "1px dashed #C9C2B3", color: "var(--navy)", padding: "4px 10px", fontSize: 12, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 4 }} onClick={() => addSlot(row.id)}>
                        <Plus size={12} /> Dodaj godzinę/halę
                      </button>
                    </div>
                  </div>
                ))}
                <button className="vb-btn" style={{ background: "#fff", border: "1px solid #C9C2B3", color: "var(--navy)", display: "flex", alignItems: "center", gap: 4, alignSelf: "flex-start" }} onClick={addDateRow}>
                  <Plus size={13} /> Dodaj termin (dzień meczowy)
                </button>
              </div>

              {genError && <div style={{ color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>{genError}</div>}

              <button className="vb-btn" style={{ background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }} onClick={handlePreviewGenerate}>
                <Wand2 size={15} /> Wygeneruj terminarz
              </button>

              {genPreview && (
                <div style={{ marginTop: 14, padding: 12, background: "#fff", border: "1px solid #DFD8C8", borderRadius: 4 }}>
                  <div style={{ fontSize: 13, marginBottom: 6 }}>
                    Wygenerowano <strong>{genPreview.scheduled.length}</strong> z {genPreview.totalMatches} meczów w {genPreview.roundsCount} kolejkach.
                  </div>
                  {genPreview.conflictCount > 0 && (
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-start", color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>
                      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                      Uwaga: {genPreview.conflictCount} meczów ma tę samą halę, datę i godzinę co inny mecz — sprawdź, czy nie powtórzyłeś/aś tej samej daty w kilku wierszach terminów.
                    </div>
                  )}
                  {genPreview.unscheduledCount > 0 && (
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-start", color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>
                      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                      {genPreview.unscheduledCount} meczów nie zmieściło się w podanych terminach — dodaj więcej dat lub slotów godzinowych.
                    </div>
                  )}
                  {matches.length > 0 && (
                    <div style={{ fontSize: 13, color: "var(--rust)", marginBottom: 8 }}>
                      Uwaga: to zastąpi obecny terminarz ({matches.length} meczów) — wpisane wyniki zostaną utracone.
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff" }} onClick={handleConfirmGenerate}>
                      Potwierdź i zastosuj
                    </button>
                    <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)" }} onClick={() => setGenPreview(null)}>
                      Anuluj
                    </button>
                  </div>
                </div>
              )}
            </Section>

            {/* Match creation */}
            <Section title="Dodaj pojedynczy mecz ręcznie">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input className="vb-input" style={{ width: 70 }} placeholder="Kolejka" value={newMatch.round}
                  onChange={(e) => setNewMatch({ ...newMatch, round: e.target.value })} />
                <input className="vb-input" style={{ width: 155 }} type="date" value={newMatch.date}
                  onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })} />
                <input className="vb-input" style={{ width: 100 }} type="time" value={newMatch.time}
                  onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })} />
                <select className="vb-input" style={{ width: 130 }} value={newMatch.venue}
                  onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}>
                  <option value="">Hala</option>
                  {venues.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
                <select className="vb-input" value={newMatch.homeId} onChange={(e) => setNewMatch({ ...newMatch, homeId: e.target.value })}>
                  <option value="">Gospodarz</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <span style={{ color: "var(--grey)" }}>vs</span>
                <select className="vb-input" value={newMatch.awayId} onChange={(e) => setNewMatch({ ...newMatch, awayId: e.target.value })}>
                  <option value="">Gość</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 4 }} onClick={addMatch}>
                  <Plus size={15} /> Dodaj mecz
                </button>
              </div>
              {teams.length < 2 && <div style={{ fontSize: 12, color: "var(--grey)", marginTop: 6 }}>Dodaj co najmniej 2 drużyny, żeby zaplanować mecz.</div>}
            </Section>

            {/* Match results */}
            <Section title="Terminarz i wyniki (edytuj w razie zmian)" defaultOpen>
              <div style={{ fontSize: 12, color: "var(--grey)", marginBottom: 10 }}>
                Możesz przełożyć mecz na inny termin, zamienić kolejkę albo zamienić drużyny — zmiany zapisują się od razu.
              </div>
              {Object.keys(venueConflicts).length > 0 && (
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start", background: "#F6E4DE", color: "var(--rust)", fontSize: 13, padding: "8px 12px", borderRadius: 4, marginBottom: 10 }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  Wykryto kolizje terminów — dwa mecze oznaczone poniżej są zaplanowane na tę samą halę, ten sam dzień i tę samą godzinę. Popraw datę, godzinę lub halę jednego z nich.
                </div>
              )}
              {matches.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--grey)" }}>Brak meczów.</div>
              ) : (
                rounds.map((round) => (
                  <Section key={round} title={`Kolejka ${round}`} defaultOpen={round === activeRound} compact>
                    {matches
                      .filter((m) => m.round === round)
                      .slice()
                      .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                      .map((m) => {
                    const o = matchOutcome(m);
                    const hasConflict = Boolean(venueConflicts[m.id]);
                    const sets = [...(m.sets || [])];
                    while (sets.length < 5) sets.push({ home: "", away: "" });
                    return (
                      <div key={m.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
                        background: "#fff", border: hasConflict ? "1px solid var(--rust)" : "1px solid #DFD8C8", borderRadius: 4, padding: "10px 14px", marginBottom: 8,
                      }}>
                        <div style={{ minWidth: "min(260px, 100%)", flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: "var(--grey)" }}>Kolejka</span>
                            <input className="vb-input" style={{ width: 46, padding: "3px 6px" }} value={m.round}
                              onChange={(e) => updateMatchField(m.id, "round", e.target.value.replace(/[^0-9]/g, ""))} />
                            <input className="vb-input" style={{ width: 140, padding: "3px 6px", borderColor: hasConflict ? "var(--rust)" : undefined }} type="date" value={m.date || ""}
                              onChange={(e) => updateMatchField(m.id, "date", e.target.value)} />
                            <input className="vb-input" style={{ width: 90, padding: "3px 6px", borderColor: hasConflict ? "var(--rust)" : undefined }} type="time" value={m.time || ""}
                              onChange={(e) => updateMatchField(m.id, "time", e.target.value)} />
                            <select className="vb-input" style={{ width: 110, padding: "3px 6px", borderColor: hasConflict ? "var(--rust)" : undefined }} value={m.venue || ""}
                              onChange={(e) => updateMatchField(m.id, "venue", e.target.value)}>
                              <option value="">Hala</option>
                              {venues.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                              {m.venue && !venues.some((v) => v.name === m.venue) && (
                                <option value={m.venue}>{m.venue} (usunięta)</option>
                              )}
                            </select>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <select className="vb-input" style={{ padding: "3px 6px", maxWidth: 110 }} value={m.homeId}
                              onChange={(e) => updateMatchField(m.id, "homeId", e.target.value)}>
                              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <span style={{ color: "var(--grey)", fontSize: 12 }}>vs</span>
                            <select className="vb-input" style={{ padding: "3px 6px", maxWidth: 110 }} value={m.awayId}
                              onChange={(e) => updateMatchField(m.id, "awayId", e.target.value)}>
                              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                          {m.homeId === m.awayId && (
                            <div style={{ fontSize: 11, color: "var(--rust)" }}>Wybierz dwie różne drużyny.</div>
                          )}
                          {hasConflict && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--rust)" }}>
                              <AlertTriangle size={12} /> Kolizja: ta sama hala i godzina co inny mecz tego dnia.
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {sets.map((s, i) => {
                              const invalid = setInvalid(s);
                              return (
                                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                  <input className="vb-score-input" style={invalid ? { borderColor: "var(--rust)" } : undefined} value={s.home}
                                    onChange={(e) => updateSet(m.id, i, "home", e.target.value)} maxLength={2} />
                                  <input className="vb-score-input" style={invalid ? { borderColor: "var(--rust)" } : undefined} value={s.away}
                                    onChange={(e) => updateSet(m.id, i, "away", e.target.value)} maxLength={2} />
                                </div>
                              );
                            })}
                          </div>
                          {sets.some((s) => setInvalid(s)) && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--rust)", maxWidth: 160 }}>
                              <AlertTriangle size={12} style={{ flexShrink: 0 }} /> Różnica musi wynosić min. 2 pkt — set się nie liczy.
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {o.played ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--oak)", fontSize: 12 }}>
                              <Check size={14} /> {o.homeSets}:{o.awaySets}
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--grey)" }}>w trakcie</span>
                          )}
                          <button onClick={() => setPrintMatchId(m.id)} title="Drukuj protokół meczowy" style={{ background: "none", border: "1px solid #C9C2B3", borderRadius: 4, cursor: "pointer", color: "var(--navy)", display: "flex", alignItems: "center", gap: 4, fontSize: 12, padding: "4px 8px" }}>
                            <Printer size={14} /> Protokół
                          </button>
                          <button onClick={() => deleteMatch(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                      })}
                  </Section>
                ))
              )}
            </Section>

            <button onClick={() => setUnlocked(false)} style={{
              background: "none", border: "none", color: "var(--grey)", fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, marginTop: 4,
            }}>
              <X size={13} /> Wyloguj z panelu admina
            </button>
          </div>
        )}
      </div>
      </div>

      {matchToPrint && (
        <MatchProtocol
          match={matchToPrint}
          teams={teams}
          seasonName={currentSeasonName}
          onClose={() => setPrintMatchId(null)}
        />
      )}

      {posterOpen && (
        <SchedulePoster
          matches={matches}
          teams={teams}
          rounds={rounds}
          seasonName={currentSeasonName}
          onClose={() => setPosterOpen(false)}
        />
      )}
    </div>
  );
}

function Section({ title, children, defaultOpen = false, compact = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      marginBottom: compact ? 8 : 12,
      border: "1px solid #DFD8C8",
      borderRadius: 4,
      background: compact ? "var(--chalk)" : "#fff",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: compact ? "8px 12px" : "12px 14px",
          fontWeight: 700, fontSize: compact ? 13 : 14, color: "var(--navy)",
          fontFamily: "'IBM Plex Sans', sans-serif", textAlign: "left",
        }}
      >
        {title}
        {open ? <ChevronDown size={compact ? 14 : 16} color="var(--oak)" /> : <ChevronRight size={compact ? 14 : 16} color="var(--oak)" />}
      </button>
      {open && <div style={{ padding: compact ? "0 10px 10px 10px" : "0 14px 14px 14px" }}>{children}</div>}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{
      textAlign: "center", padding: "40px 20px", color: "var(--grey)", border: "1px dashed #C9C2B3",
      borderRadius: 4, fontSize: 14,
    }}>
      {text}
    </div>
  );
}

function SchedulePoster({ matches, teams, rounds, seasonName, onClose }) {
  const teamName = (id) => teams.find((t) => t.id === id)?.name || "—";
  const generatedAt = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="vb-poster-overlay" style={{
      position: "fixed", inset: 0, background: "rgba(22,48,61,0.55)", zIndex: 1000,
      overflowY: "auto", padding: "28px 16px",
    }}>
      <div className="vb-no-print" style={{
        maxWidth: 760, margin: "0 auto 12px auto", display: "flex", justifyContent: "flex-end", gap: 8,
      }}>
        <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }} onClick={() => window.print()}>
          <Printer size={15} /> Drukuj / Zapisz jako PDF
        </button>
        <button className="vb-btn" style={{ background: "#fff", border: "1px solid #C9C2B3", color: "var(--navy)", display: "flex", alignItems: "center", gap: 6 }} onClick={onClose}>
          <X size={15} /> Zamknij
        </button>
      </div>

      <div className="vb-poster-sheet vb-root" style={{
        maxWidth: 760, margin: "0 auto", background: "#fff",
        boxShadow: "0 6px 24px rgba(0,0,0,0.25)", fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--navy)",
        overflow: "hidden", borderRadius: 6,
      }}>
        <div style={{
          background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%)",
          padding: "30px 32px", textAlign: "center", position: "relative",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "var(--amber)" }} />
          <img src={LOGO_DATA_URI} alt="Towarzystwo Sportowe w Wągrowcu" style={{ width: 92, height: 92, marginBottom: 10 }} />
          <div className="vb-display" style={{ color: "var(--amber)", fontSize: 40, letterSpacing: "0.03em", lineHeight: 1 }}>
            TERMINARZ ROZGRYWEK
          </div>
          <div style={{ color: "var(--chalk)", fontSize: 15, marginTop: 6 }}>
            Liga Siatkówki{seasonName ? ` — sezon ${seasonName}` : ""}
          </div>
        </div>

        <div style={{ padding: "26px 32px 32px 32px" }}>
          {rounds.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--grey)", padding: "20px 0" }}>Brak zaplanowanych meczów.</div>
          ) : (
            rounds.map((round) => {
              const roundMatches = matches
                .filter((m) => m.round === round)
                .slice()
                .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.time || "").localeCompare(b.time || ""));
              if (roundMatches.length === 0) return null;
              return (
                <div key={round} className="vb-poster-round" style={{ marginBottom: 20 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
                    borderBottom: "2px solid var(--oak)", paddingBottom: 4,
                  }}>
                    <span className="vb-display" style={{ fontSize: 20, color: "var(--navy)" }}>KOLEJKA {round}</span>
                  </div>
                  {roundMatches.map((m) => (
                    <div key={m.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 4px", borderBottom: "1px solid #EAE5D9", gap: 10, flexWrap: "wrap",
                    }}>
                      <span style={{ fontSize: 12, color: "var(--grey)", minWidth: 170 }}>
                        {m.date ? formatDate(m.date) : "termin TBA"}{m.time ? ` · ${m.time}` : ""}{m.venue ? ` · ${m.venue}` : ""}
                      </span>
                      <span style={{ flex: 1, textAlign: "right", fontWeight: 600, fontSize: 14 }}>{teamName(m.homeId)}</span>
                      <span className="vb-display" style={{ color: "var(--oak)", fontSize: 16, padding: "0 4px" }}>vs</span>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{teamName(m.awayId)}</span>
                    </div>
                  ))}
                </div>
              );
            })
          )}

          <div style={{
            marginTop: 24, paddingTop: 14, borderTop: "1px solid #DFD8C8",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 11, color: "var(--grey)",
          }}>
            <span>Towarzystwo Sportowe w Wągrowcu</span>
            <span>Wygenerowano: {generatedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchProtocol({ match, teams, seasonName, onClose }) {
  const teamName = (id) => teams.find((t) => t.id === id)?.name || "—";
  const o = matchOutcome(match);
  const sets = [...(match.sets || [])];
  while (sets.length < 5) sets.push({ home: "", away: "" });
  const printedAt = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  const protocolNo = `${match.round || "?"}/${(match.id || "").toUpperCase()}`;

  return (
    <div className="vb-protocol-overlay" style={{
      position: "fixed", inset: 0, background: "rgba(22,48,61,0.55)", zIndex: 1000,
      overflowY: "auto", padding: "28px 16px",
    }}>
      <div className="vb-no-print" style={{
        maxWidth: 720, margin: "0 auto 12px auto", display: "flex", justifyContent: "flex-end", gap: 8,
      }}>
        <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }} onClick={() => window.print()}>
          <Printer size={15} /> Drukuj
        </button>
        <button className="vb-btn" style={{ background: "#fff", border: "1px solid #C9C2B3", color: "var(--navy)", display: "flex", alignItems: "center", gap: 6 }} onClick={onClose}>
          <X size={15} /> Zamknij
        </button>
      </div>

      <div className="vb-protocol-sheet vb-root" style={{
        maxWidth: 720, margin: "0 auto", background: "#fff", padding: "36px 42px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.25)", fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--navy)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 18, borderBottom: "2px solid var(--navy)", paddingBottom: 14 }}>
          <div className="vb-display" style={{ fontSize: 24, letterSpacing: "0.03em" }}>PROTOKÓŁ MECZOWY</div>
          <div style={{ fontSize: 13, color: "var(--grey)", marginTop: 2 }}>Liga Siatkówki{seasonName ? ` — sezon ${seasonName}` : ""}</div>
          <div style={{ fontSize: 11, color: "var(--grey)", marginTop: 4 }}>Nr protokołu: {protocolNo}</div>
        </div>

        <table className="vb-protocol-table" style={{ marginBottom: 18 }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600, width: "25%", textAlign: "left" }}>Kolejka</td>
              <td style={{ textAlign: "left" }}>{match.round || "—"}</td>
              <td style={{ fontWeight: 600, width: "25%", textAlign: "left" }}>Data / godzina</td>
              <td style={{ textAlign: "left" }}>{formatDate(match.date) || "—"}{match.time ? `, ${match.time}` : ""}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, textAlign: "left" }}>Hala</td>
              <td colSpan={3} style={{ textAlign: "left" }}>{match.venue || "—"}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, padding: "10px 4px" }}>
          <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 16 }}>{teamName(match.homeId)}</div>
          <div className="vb-display" style={{ fontSize: 28, padding: "0 18px", color: "var(--navy)" }}>
            {o.played ? `${o.homeSets} : ${o.awaySets}` : "— : —"}
          </div>
          <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 16 }}>{teamName(match.awayId)}</div>
        </div>

        <table className="vb-protocol-table" style={{ marginBottom: 10 }}>
          <thead>
            <tr>
              <th>Set</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600, textAlign: "left" }}>{teamName(match.homeId)}</td>
              {sets.map((s, i) => <td key={i}>{s.home !== "" ? s.home : "—"}</td>)}
            </tr>
            <tr>
              <td style={{ fontWeight: 600, textAlign: "left" }}>{teamName(match.awayId)}</td>
              {sets.map((s, i) => <td key={i}>{s.away !== "" ? s.away : "—"}</td>)}
            </tr>
          </tbody>
        </table>

        {o.played && (
          <div style={{ fontSize: 12, color: "var(--grey)", marginBottom: 18 }}>
            Punkty w setach: {o.homePts}:{o.awayPts} &nbsp;•&nbsp; Punkty ligowe: {o.leaguePts.home}:{o.leaguePts.away}
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Uwagi / zastrzeżenia:</div>
          <div className="vb-sig-line" style={{ marginBottom: 6 }}></div>
          <div className="vb-sig-line"></div>
        </div>

        <div className="vb-sig-row" style={{ display: "flex", gap: 20, marginTop: 30 }}>
          {["Sędzia", `Kapitan — ${teamName(match.homeId)}`, `Kapitan — ${teamName(match.awayId)}`].map((label) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div className="vb-sig-line"></div>
              <div style={{ fontSize: 11, color: "var(--grey)", marginTop: 4 }}>{label} (podpis)</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: "var(--grey)", marginTop: 28, textAlign: "right" }}>
          Protokół wygenerowany: {printedAt}
        </div>
      </div>
    </div>
  );
}
