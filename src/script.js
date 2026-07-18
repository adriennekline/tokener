// DOM Elements
const fileInput = document.getElementById("fileInput");
const directoryInput = document.getElementById("directoryInput");
const dropZone = document.getElementById("dropZone");
const noteList = document.getElementById("noteList");
const rowIndicator = document.getElementById("rowIndicator");
const textDisplay = document.getElementById("text-display");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const downloadBtn = document.getElementById("downloadBtn");
const annotationToolbar = document.getElementById("annotationToolbar");
const addLabelButton = document.getElementById("add-label-button");
const customLabelName = document.getElementById("custom-label-name");
const customLabelColor = document.getElementById("custom-label-color");
const annotationsDiv = document.getElementById("annotations");
const filenameInput = document.getElementById("filename-input");

// Data Structures
let originalNotes = [];
let notes = [];
let noteTitles = [];
let annotations = {};
let currentIndex = -1;
let customLabels = {};
const ANNOTATION_PREVIEW_MAX_LENGTH = 60;

// Utility Functions
function getContrastYIQ(hexcolor) {
  hexcolor = hexcolor.replace("#", "");
  let r, g, b;
  if (hexcolor.length === 3) {
    r = parseInt(hexcolor[0] + hexcolor[0], 16);
    g = parseInt(hexcolor[1] + hexcolor[1], 16);
    b = parseInt(hexcolor[2] + hexcolor[2], 16);
  } else {
    r = parseInt(hexcolor.substr(0, 2), 16);
    g = parseInt(hexcolor.substr(2, 2), 16);
    b = parseInt(hexcolor.substr(4, 2), 16);
  }
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

function isSupportedFile(file) {
  const fileName = file.name.toLowerCase();
  return (
    file.type === "text/csv" ||
    file.type === "text/plain" ||
    fileName.endsWith(".csv") ||
    fileName.endsWith(".txt")
  );
}

function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

function getNoteTitleFromFile(file) {
  return file && file.name ? file.name : "Untitled note";
}

function normalizeFilename(name, defaultBase, extension) {
  const trimmed = (name || "").trim();
  const safeBase = trimmed.replace(/\.(json|zip)$/i, "") || defaultBase;
  return `${safeBase}${extension}`;
}

async function handleSelectedFiles(fileList) {
  const allFiles = Array.from(fileList || []);
  const supportedFiles = allFiles.filter((file) => isSupportedFile(file));

  if (supportedFiles.length === 0) {
    alert("No valid CSV or TXT files were provided.");
    return;
  }

  resetData();

  for (const file of supportedFiles) {
    try {
      const content = await readFileContent(file);
      const fileName = file.name.toLowerCase();
      const title = getNoteTitleFromFile(file);

      if (fileName.endsWith(".csv")) {
        const lines = content.split(/\r\n|\n/).filter((line) => line.trim() !== "");
        lines.forEach((line) => {
          originalNotes.push(line);
          notes.push(line);
          noteTitles.push(title);
        });
      } else {
        const cleanedText = content.trim();
        if (cleanedText.length > 0) {
          originalNotes.push(cleanedText);
          notes.push(cleanedText);
          noteTitles.push(title);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (notes.length > 0) {
    displayNotes();
  } else {
    alert("No readable content found in the selected files.");
  }
}

// File Upload Handler
fileInput.addEventListener("change", function (event) {
  handleSelectedFiles(event.target.files);
  fileInput.value = "";
});

if (directoryInput) {
  directoryInput.addEventListener("change", function (event) {
    handleSelectedFiles(event.target.files);
    directoryInput.value = "";
  });
}

if (dropZone) {
  dropZone.addEventListener("dragover", function (event) {
    event.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", function () {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", function (event) {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
    handleSelectedFiles(event.dataTransfer.files);
  });
}

// Parse CSV File
function parseCSV(data) {
  resetData();

  const lines = data.split(/\r\n|\n/).filter((line) => line.trim() !== "");
  lines.forEach((line) => {
    originalNotes.push(line);
    notes.push(line);
  });

  if (notes.length > 0) {
    displayNotes();
  } else {
    alert("The CSV file is empty.");
  }
}

// Parse Text File
function parseText(data) {
  resetData();
  const cleanedText = data.trim();
  if (cleanedText.length > 0) {
    originalNotes.push(cleanedText);
    notes.push(cleanedText);
    displayNotes();
  } else {
    alert("The Text file is empty.");
  }
}

// Reset Data
function resetData() {
  originalNotes = [];
  notes = [];
  noteTitles = [];
  annotations = {};
  currentIndex = -1;
  textDisplay.innerHTML = "No note selected.";
  rowIndicator.textContent = "Select a note to begin";
  noteList.innerHTML = "";
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  downloadBtn.disabled = true;
  filenameInput.value = "";
}

// Display Notes in Sidebar
function displayNotes() {
  noteList.innerHTML = "";
  notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.textContent = noteTitles[index] || `Note ${index + 1}`;
    li.dataset.index = index;

    if (annotations[index] && annotations[index].length > 0) {
      li.classList.add("annotated");
    }

    li.addEventListener("click", () => selectNote(index));
    noteList.appendChild(li);
  });
}

// Truncate Text Helper
function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// Select a Note
function selectNote(index) {
  currentIndex = index;
  rowIndicator.textContent = `Note ${currentIndex + 1} of ${notes.length}`;
  highlightActiveNote();
  renderAnnotations();
  renderText();
  updateNavigationButtons();
  downloadBtn.disabled = !(
    annotations[currentIndex] && annotations[currentIndex].length > 0
  );
}

// Highlight Active Note in Sidebar
function highlightActiveNote() {
  Array.from(noteList.children).forEach((li) => {
    li.classList.remove("active");
    if (parseInt(li.dataset.index, 10) === currentIndex) {
      li.classList.add("active");
    }
  });
}

// Update Navigation Buttons
function updateNavigationButtons() {
  prevBtn.disabled = currentIndex <= 0;
  nextBtn.disabled = currentIndex >= notes.length - 1;
}

// Predefined Labels and Their Colors
const predefinedLabels = {
  DATE: "#4ecdc4",
  NAME: "#de6312",
  LOCATION: "#ffcc00",
};

// Insert Annotation in Sorted Order with Merging
function insertAnnotationSorted(noteIndex, newAnn) {
  const annArray = annotations[noteIndex];
  const sameLabelAnns = annArray.filter((ann) => ann.label === newAnn.label);

  const overlappingAnns = sameLabelAnns.filter(
    (ann) => !(newAnn.end_idx < ann.start_idx - 1 || newAnn.start_idx > ann.end_idx + 1)
  );

  if (overlappingAnns.length > 0) {
    const mergedStart = Math.min(newAnn.start_idx, ...overlappingAnns.map((ann) => ann.start_idx));
    const mergedEnd = Math.max(newAnn.end_idx, ...overlappingAnns.map((ann) => ann.end_idx));

    annotations[noteIndex] = annArray.filter(
      (ann) =>
        !(
          ann.label === newAnn.label &&
          !(newAnn.end_idx < ann.start_idx - 1 || newAnn.start_idx > ann.end_idx + 1)
        )
    );

    const mergedAnnotation = {
      label: newAnn.label,
      color: newAnn.color,
      start_idx: mergedStart,
      end_idx: mergedEnd,
      text: notes[noteIndex].substring(mergedStart, mergedEnd),
    };

    let inserted = false;
    for (let i = 0; i < annotations[noteIndex].length; i++) {
      if (mergedAnnotation.start_idx < annotations[noteIndex][i].start_idx) {
        annotations[noteIndex].splice(i, 0, mergedAnnotation);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      annotations[noteIndex].push(mergedAnnotation);
    }
  } else {
    let inserted = false;
    for (let i = 0; i < annArray.length; i++) {
      if (newAnn.start_idx < annArray[i].start_idx) {
        annArray.splice(i, 0, newAnn);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      annArray.push(newAnn);
    }
  }
}

// Handle Label Assignment and Removal via Annotation Toolbar
annotationToolbar.addEventListener("click", function (event) {
  if (event.target.classList.contains("label-button")) {
    if (currentIndex < 0 || !notes[currentIndex]) {
      alert("Please select a note before assigning a label.");
      return;
    }

    const label = event.target.textContent;
    const color = predefinedLabels[label] || customLabels[label];
    if (!color) {
      alert("Label color not found.");
      return;
    }

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();
      if (selectedText.trim()) {
        const { start, end } = getSelectionIndices(range);

        if (start >= 0 && end <= notes[currentIndex].length && start < end) {
          const annotation = {
            label: label,
            color: color,
            start_idx: start,
            end_idx: end,
            text: notes[currentIndex].substring(start, end),
          };

          if (!annotations[currentIndex]) {
            annotations[currentIndex] = [];
          }

          insertAnnotationSorted(currentIndex, annotation);
          renderAnnotations();
          renderText();

          const li = noteList.querySelector(`li[data-index='${currentIndex}']`);
          if (li) {
            li.classList.add("annotated");
          }

          selection.removeAllRanges();
          downloadBtn.disabled = false;
        } else {
          alert("Invalid selection range. Please try again.");
        }
      } else {
        alert("Please highlight text before assigning a label.");
      }
    } else {
      alert("Please highlight text before assigning a label.");
    }
  }

  if (event.target.classList.contains("remove-label")) {
    const labelContainer = event.target.parentElement;
    const labelButton = labelContainer.querySelector(".label-button");
    const labelName = labelButton.textContent;

    const confirmRemoval = confirm(
      `Are you sure you want to remove the custom label "${labelName}"?`
    );
    if (!confirmRemoval) return;

    delete customLabels[labelName];
    labelContainer.remove();
  }
});

// Handle Adding Custom Labels
addLabelButton.addEventListener("click", () => {
  const labelName = customLabelName.value.trim();
  const labelColor = customLabelColor.value;

  if (!labelName) {
    alert("Please enter a label name.");
    return;
  }

  if (predefinedLabels[labelName] || customLabels[labelName]) {
    alert("Label already exists.");
    return;
  }

  customLabels[labelName] = labelColor;

  const labelContainer = document.createElement("div");
  labelContainer.classList.add("label-container");

  const button = document.createElement("button");
  button.classList.add("label-button");
  button.textContent = labelName;
  button.style.backgroundColor = labelColor;
  button.style.color = getContrastYIQ(labelColor);

  const removeSpan = document.createElement("span");
  removeSpan.classList.add("remove-label");
  removeSpan.textContent = "x";

  labelContainer.appendChild(button);
  labelContainer.appendChild(removeSpan);
  annotationToolbar.appendChild(labelContainer);

  customLabelName.value = "";
  customLabelColor.value = "#888888";

  alert(`Custom label "${labelName}" added.`);
});

// Get Selection Indices
function getSelectionIndices(range) {
  const preSelectionRange = document.createRange();
  preSelectionRange.selectNodeContents(textDisplay);
  preSelectionRange.setEnd(range.startContainer, range.startOffset);
  const start = preSelectionRange.toString().length;
  const end = start + range.toString().length;
  return { start, end };
}

// Render Annotations List
function renderAnnotations() {
  annotationsDiv.innerHTML = "";
  if (!annotations[currentIndex] || annotations[currentIndex].length === 0) {
    annotationsDiv.innerHTML = "<p>No annotations for this note.</p>";
    return;
  }

  annotations[currentIndex].forEach((annotation, index) => {
    const annotationDiv = document.createElement("div");
    annotationDiv.classList.add("annotation");

    const textLabelDiv = document.createElement("div");
    textLabelDiv.style.display = "inline-flex";
    textLabelDiv.style.alignItems = "center";
    textLabelDiv.style.gap = "5px";

    const textSpan = document.createElement("span");
    const previewText = truncateText(annotation.text, ANNOTATION_PREVIEW_MAX_LENGTH);
    textSpan.textContent = `${index + 1}. "${previewText}" (${annotation.start_idx}-${annotation.end_idx}) -`;
    textSpan.title = annotation.text;

    const labelSpan = document.createElement("span");
    labelSpan.textContent = annotation.label;
    labelSpan.style.color = annotation.color;
    labelSpan.style.fontWeight = "bold";

    textLabelDiv.appendChild(textSpan);
    textLabelDiv.appendChild(labelSpan);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.setAttribute("data-note-index", currentIndex);
    removeBtn.setAttribute("data-annotation-index", index);

    annotationDiv.appendChild(textLabelDiv);
    annotationDiv.appendChild(removeBtn);
    annotationsDiv.appendChild(annotationDiv);
  });
}

// Event Delegation for Remove Buttons
annotationsDiv.addEventListener("click", (event) => {
  if (
    event.target.tagName.toLowerCase() === "button" &&
    event.target.textContent === "Remove"
  ) {
    const noteIdx = parseInt(event.target.getAttribute("data-note-index"), 10);
    const annIdx = parseInt(event.target.getAttribute("data-annotation-index"), 10);
    removeAnnotation(noteIdx, annIdx);
  }
});

// Remove Annotation Function
function removeAnnotation(noteIndex, annotationIndex) {
  if (annotations[noteIndex] && annotations[noteIndex].length > annotationIndex) {
    annotations[noteIndex].splice(annotationIndex, 1);
    renderAnnotations();
    renderText();

    const li = noteList.querySelector(`li[data-index='${noteIndex}']`);
    if (li && (!annotations[noteIndex] || annotations[noteIndex].length === 0)) {
      li.classList.remove("annotated");
    }

    if (noteIndex === currentIndex) {
      downloadBtn.disabled = !(
        annotations[currentIndex] && annotations[currentIndex].length > 0
      );
    }
  } else {
    alert("Invalid annotation index.");
  }
}

// Render Text with Highlights
function renderText() {
  const text = notes[currentIndex];
  if (!text) {
    textDisplay.innerHTML = "No note selected.";
    return;
  }

  if (!annotations[currentIndex] || annotations[currentIndex].length === 0) {
    textDisplay.innerHTML = escapeHtml(text);
    return;
  }

  const sortedAnnotations = annotations[currentIndex];
  const boundaries = [];

  sortedAnnotations.forEach((ann) => {
    boundaries.push({ index: ann.start_idx, type: "start", ann });
    boundaries.push({ index: ann.end_idx, type: "end", ann });
  });

  boundaries.sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    if (a.type === "end" && b.type === "start") return -1;
    if (a.type === "start" && b.type === "end") return 1;
    return 0;
  });

  let result = "";
  let activeAnnotations = [];
  let lastIndex = 0;

  boundaries.forEach((boundary) => {
    const { index, type, ann } = boundary;

    if (index > lastIndex) {
      const segment = escapeHtml(text.slice(lastIndex, index));

      if (activeAnnotations.length === 0) {
        result += segment;
      } else {
        let nestedSegment = segment;
        activeAnnotations.forEach((activeAnn) => {
          nestedSegment = `<span class="highlight" style="background-color: ${activeAnn.color}; color: ${getContrastYIQ(activeAnn.color)};" title="${escapeHtml(activeAnn.label)}">${nestedSegment}</span>`;
        });
        result += nestedSegment;
      }

      lastIndex = index;
    }

    if (type === "start") {
      activeAnnotations.push(ann);
    } else {
      activeAnnotations = activeAnnotations.filter((a) => a !== ann);
    }
  });

  if (lastIndex < text.length) {
    const segment = escapeHtml(text.slice(lastIndex));

    if (activeAnnotations.length === 0) {
      result += segment;
    } else {
      let nestedSegment = segment;
      activeAnnotations.forEach((activeAnn) => {
        nestedSegment = `<span class="highlight" style="background-color: ${activeAnn.color}; color: ${getContrastYIQ(activeAnn.color)};" title="${escapeHtml(activeAnn.label)}">${nestedSegment}</span>`;
      });
      result += nestedSegment;
    }
  }

  textDisplay.innerHTML = result;
}

// Handle Download Annotations
downloadBtn.addEventListener("click", async () => {
  const requestedFilename = filenameInput.value.trim();

  const annotationsData = originalNotes
    .map((note, index) => ({
      note_index: index,
      note: notes[index],
      annotations: annotations[index] || [],
    }))
    .filter((entry) => entry.annotations.length > 0);

  if (annotationsData.length === 0) {
    alert("No annotated notes to download.");
    return;
  }

  if (annotationsData.length > 1) {
    if (typeof JSZip === "undefined") {
      alert("ZIP export is unavailable because JSZip did not load.");
      return;
    }

    const zip = new JSZip();
    annotationsData.forEach((entry) => {
      const fileName = `note_${entry.note_index + 1}.json`;
      const payload = {
        format: "SPAN",
        note_index: entry.note_index,
        note: entry.note,
        annotations: entry.annotations,
      };
      zip.file(fileName, JSON.stringify(payload, null, 2));
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipFilename = normalizeFilename(requestedFilename, "annotations", ".zip");
    const zipUrl = URL.createObjectURL(zipBlob);
    const zipLink = document.createElement("a");
    zipLink.href = zipUrl;
    zipLink.download = zipFilename;
    document.body.appendChild(zipLink);
    zipLink.click();
    document.body.removeChild(zipLink);
    URL.revokeObjectURL(zipUrl);
    return;
  }

  const filename = normalizeFilename(requestedFilename, "annotations", ".json");

  const dataToDownload = {
    annotations: annotationsData,
  };

  const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Handle Navigation Buttons
prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    selectNote(currentIndex - 1);
  }
});

nextBtn.addEventListener("click", () => {
  if (currentIndex < notes.length - 1) {
    selectNote(currentIndex + 1);
  }
});
