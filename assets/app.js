(function () {

const normalizeText = function (s) {
  return s.trim().replace(/\s+/, " ");
};

const drawText = function (ctx, sourceText, fontSize, width, x, y) {
	const text = normalizeText(sourceText);
	let metrics;

  while (true) {
  	ctx.font = `${fontSize}px "Bai Jamjuree"`;
  	metrics = ctx.measureText(text);

  	if (metrics.width < width) {
  		break;
  	}

  	fontSize -= 1;
  }

  ctx.fillText(text, x + ((width / 2) - (metrics.width / 2)), y);
};

const docImage = new Image();
docImage.addEventListener("load", function() {
  const generator = document.getElementById("generator");
  generator.classList.remove("invisible");

  const sig = document.getElementById("signaturePad");
  const sigCtx = sig.getContext("2d");

  const doc = document.createElement("canvas");
  const docCtx = doc.getContext("2d");
  doc.width = 2550;
  doc.height = 3300;

  const placeInput = document.getElementById("placeInput");
  const initialInput = document.getElementById("initialInput");
  const firstNameInput = document.getElementById("firstNameInput");
  const lastNameInput = document.getElementById("lastNameInput");
  const idInput = document.getElementById("idInput");

  const signatureField = document.getElementById("signatureField");
  const signatureCover = document.getElementById("signatureCover");
  const signatureToolbar = document.getElementById("signatureToolbar");
  const signatureUndoButton = document.getElementById("signatureUndoButton");
  const signatureClearButton = document.getElementById("signatureClearButton");
  const signatureDoneButton = document.getElementById("signatureDoneButton");

  const SIG_WIDTH = 600;
  const SIG_HEIGHT = 300;
  const signaturePad = new SignaturePad(sig, {
    minWidth: 1,
    maxWidth: 3,
  });

  const generateButton = document.getElementById("generateButton");
  const downloadButton = document.getElementById("downloadButton");
  const backButton = document.getElementById("backButton");

  const outputImage = document.getElementById("outputImage");
  const output = document.getElementById("output");

  let cid;

  generateButton.addEventListener("click", function () {
    docCtx.drawImage(docImage, 0, 0);

    drawText(docCtx, normalizeText(placeInput.value), 48, 688, 1563, 1025);

    const date = new Date();

    const months = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤศภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤษจิกายน",
      "ธันวาคม",
    ];

    drawText(docCtx, String(date.getDate()), 48, 105, 1338, 1113);
    drawText(docCtx, months[date.getMonth()], 48, 418, 1542, 1113);
    drawText(docCtx, String(date.getFullYear() + 543), 48, 175, 2076, 1113);

    const fullName = initialInput.value
      + normalizeText(firstNameInput.value)
      + " "
      + normalizeText(lastNameInput.value);

    drawText(docCtx, fullName, 96, 1358, 975, 1360);

    {
      let i = 0;
      let x;

      for (x of [1011, 1131, 1225, 1314, 1404, 1525, 1615, 1705, 1795, 1884, 2006, 2096, 2216]) {
        drawText(docCtx, cid[i], 104, 80, x, 1560);
        i += 1;
      }
    }

    drawText(docCtx, fullName, 48, 592, 1248, 2387);

    const sigData = sigCtx.getImageData(0, 0, SIG_WIDTH, SIG_HEIGHT);

    let left;
    let right;

    {
      let top;

      FIND_LEFT: for (left = 0; left < SIG_WIDTH; left += 1) {
        for (top = 0; top < SIG_HEIGHT; top += 1) {
          if (sigData.data[(top * (sigData.width * 4) + left * 4) + 3] !== 0) {
            break FIND_LEFT;
          }
        }
      }
      FIND_RIGHT: for (right = SIG_WIDTH - 1; right > -1; right -= 1) {
        for (top = 0; top < SIG_HEIGHT; top += 1) {
          if (sigData.data[(top * (sigData.width * 4) + right * 4) + 3] !== 0) {
            break FIND_RIGHT;
          }
        }
      }
    }

    docCtx.drawImage(sig, 1523 - left - ((right - left) / 2), 2052);

    downloadButton.href = outputImage.src = doc.toDataURL();

    generator.classList.add("d-none");
    output.classList.remove("d-none");

    setTimeout(function () {
      output.scrollIntoView();
    }, 200);
  });

  const validate = function () {
    let valid = true;

    for (let input of [placeInput, initialInput, firstNameInput, lastNameInput]) {
      if (input.value.trim() === "") {
        input.classList.remove("is-valid");
        valid = false;
      } else {
        input.classList.add("is-valid");
      }
    }

    idInput.classList.remove("is-valid");
    idInput.classList.remove("is-invalid");

    cid = idInput.value.trim().replace(/[ \-]/g, "");
    let idIsValid = false;

    if (/^\d{13}$/.test(cid)) {
      let sum = 0;

      for (let i = 0; i < 12; i += 1) {
          sum += Number(cid[i]) * (13 - i);
      }

      if ((11 - sum % 11) % 10 === Number(cid[12])) {
        idIsValid = true;
      }

    }

    if (cid !== "") {
      idInput.classList.add(idIsValid ? "is-valid" : "is-invalid");
    }

    if (signaturePad.isEmpty()) {
      signatureField.classList.remove("is-valid");
    } else {
      signatureField.classList.add("is-valid");
    }

    generateButton.disabled = !(valid && idIsValid && !signaturePad.isEmpty());
  };

  let validateTimeout;

  document.addEventListener("input", function () {
    clearTimeout(validateTimeout);
    validateTimeout = setTimeout(validate, 500);
  });

  signatureStartButton.addEventListener("click", function () {
    signatureCover.classList.add("d-none");
    signatureUndoButton.disabled = false;
    signatureClearButton.disabled = false;
    signatureDoneButton.disabled = false;
    signatureToolbar.classList.remove("d-none");
  });

  signatureDoneButton.addEventListener("click", function () {
    signatureCover.classList.remove("d-none");
    signatureUndoButton.disabled = true;
    signatureClearButton.disabled = true;
    signatureDoneButton.disabled = true;

    signatureStartButton.innerHTML = signaturePad.isEmpty()
      ? '<i class="bi-pen"></i> ลงลายมือชื่อ'
      : '<i class="bi-pen"></i> แก้ไขลายมือชื่อ';
    signatureToolbar.classList.add("d-none");

    validate();
  });

  signatureUndoButton.addEventListener("click", function () {
    const data = signaturePad.toData();

    if (data) {
      data.pop();
      signaturePad.fromData(data);
    }

    validate();
  });

  signatureClearButton.addEventListener("click", function () {
    signaturePad.clear();
    validate();
  });

  backButton.addEventListener("click", function () {
    output.classList.add("d-none");
    generator.classList.remove("d-none");

    if (!signatureDoneButton.disabled) {
      signatureDoneButton.click();
    }

    setTimeout(function () {
      generator.scrollIntoView();
    }, 200);
  });
});
docImage.src = "/assets/doc.png";

})();
