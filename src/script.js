// DOM Elements
const fileInput = document.getElementById("fileInput");
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
const filenameInput = document.getElementById("filename-input"); // New Element

// Data Structures
let originalNotes = [];
let notes = [];
let annotations = {};
let currentIndex = -1;
let customLabels = {};

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

function cleanMarkdown(text) {
  // Remove markdown headers (# ## ### etc.)
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Remove bold (**text** or __text__)
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');
  
  // Remove italic (*text* or _text_)
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/_(.+?)_/g, '$1');
  
  // Remove strikethrough (~~text~~)
  text = text.replace(/~~(.+?)~~/g, '$1');
  
  // Remove inline code (`code`)
  text = text.replace(/`(.+?)`/g, '$1');
  
  // Remove links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove image links ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1');
  
  // Remove blockquotes (> )
  text = text.replace(/^>\s+/gm, '');
  
  // Remove horizontal rules (---, ***, ___)
// Parse CSV File
function parseCSV(data) {
  resetData();

  const lines = data.split(/\r\n|\n/).filter((line) => line.trim() !== "");
  lines.forEach((line) => {
    const cleaned = cleanMarkdown(line);
    originalNotes.push(line);
    notes.push(cleaned);
  });

  if (notes.length > 0) {
    displayNotes();
  } else {
    alert("The CSV file is empty.");
  }
} const file = event.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }

  const validTypes = ["text/csv", "text/plain"];
  if (!validTypes.includes(file.type)) {
    alert("Please upload a valid CSV or Text file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    if (file.type === "text/csv") {
      parseCSV(content);
    } else if (file.type === "text/plain") {
      parseText(content);
    } else {
      alert("Unsupported file type.");
    }
  };
  reader.readAsText(file);
});

// Parse CSV File
function parseCSV(data) {
  paragraphs.forEach((paragraph) => {
    const cleaned = cleanMarkdown(paragraph);
    originalNotes.push(paragraph);
    notes.push(cleaned);
  });

  if (notes.length > 0) {
    displayNotes();
  } else {
    alert("The Text file is empty.");
  }
} } else {
    alert("The CSV file is empty.");
  }
}

// Parse Text File
function parseText(data) {
  resetData();

  // Try to parse by paragraphs (double line breaks)
  let paragraphs = data
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim() !== "");
  
  // If only one paragraph found, try splitting by sentences
  if (paragraphs.length === 1) {
    const sentences = paragraphs[0]
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => sentence.trim() !== "");
    if (sentences.length > 1) {
      paragraphs = sentences;
    }
  }
  
  // If still only one item, split by lines as fallback
  if (paragraphs.length === 1) {
    const lines = data.split(/\r\n|\n/).filter((line) => line.trim() !== "");
    if (lines.length > 1) {
      paragraphs = lines;
    }
  }

  paragraphs.forEach((paragraph) => {
    originalNotes.push(paragraph);
    notes.push(paragraph);
  });

  if (notes.length > 0) {
    displayNotes();
  } else {
    alert("The Text file is empty.");
  }
}

// Reset Data
function resetData() {
  originalNotes = [];
  notes = [];
  annotations = {};
  currentIndex = -1;
  textDisplay.innerHTML = "No note selected.";
  rowIndicator.textContent = "Select a note to begin";
  noteList.innerHTML = "";
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  downloadBtn.disabled = true;
  filenameInput.value = ""; // Reset filename input
}

// Display Notes in Sidebar
function displayNotes() {
  noteList.innerHTML = "";
  notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.textContent = `Note ${index + 1}: ${truncateText(note, 50)}`;
    li.dataset.index = index;

    // Add 'annotated' class if annotations exist
    if (annotations[index] && annotations[index].length > 0) {
      li.classList.add("annotated");
    }

    // Click Event to Select Note
    li.addEventListener("click", () => selectNote(index));
    noteList.appendChild(li);
  });
}

// Truncate Text Helper
function truncateText(text, maxLength) {
  // Remove extra whitespace and line breaks for preview
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + "..." : cleaned;
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
    if (parseInt(li.dataset.index) === currentIndex) {
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
  Date: "#4ecdc4",
  Name: "#de6312",
  Location: "#ffcc00",
  // Removed 'Other' label
};

// Insert Annotation in Sorted Order with Merging
function insertAnnotationSorted(noteIndex, newAnn) {
  const annArray = annotations[noteIndex];
  const sameLabelAnns = annArray.filter((ann) => ann.label === newAnn.label);

  // Find annotations to merge (overlapping or adjacent)
  const overlappingAnns = sameLabelAnns.filter(
    (ann) =>
      !(
        newAnn.end_idx < ann.start_idx - 1 || newAnn.start_idx > ann.end_idx + 1
      )
  );

  if (overlappingAnns.length > 0) {
    // Determine the merged range
    const mergedStart = Math.min(
      newAnn.start_idx,
      ...overlappingAnns.map((ann) => ann.start_idx)
    );
    const mergedEnd = Math.max(
      newAnn.end_idx,
      ...overlappingAnns.map((ann) => ann.end_idx)
    );

    // Remove the overlapping annotations
    annotations[noteIndex] = annArray.filter(
      (ann) =>
        !(
          ann.label === newAnn.label &&
          !(
            newAnn.end_idx < ann.start_idx - 1 ||
            newAnn.start_idx > ann.end_idx + 1
          )
        )
    );

    // Create the merged annotation
    const mergedAnnotation = {
      label: newAnn.label,
      color: newAnn.color,
      start_idx: mergedStart,
      end_idx: mergedEnd,
      text: notes[noteIndex].substring(mergedStart, mergedEnd),
    };

    // Insert the merged annotation in sorted order
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
    // No overlapping annotations, insert normally
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
  // Handle label assignment
  if (event.target.classList.contains("label-button")) {
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

        // Validate selection range
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

          // Insert annotation with merging
          insertAnnotationSorted(currentIndex, annotation);
          renderAnnotations();
          renderText();

          // Mark note as annotated
          const li = noteList.querySelector(`li[data-index='${currentIndex}']`);
          if (li) {
            li.classList.add("annotated");
          }

          // Clear selection
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

  // Handle label removal
  if (event.target.classList.contains("remove-label")) {
    const labelContainer = event.target.parentElement;
    const labelButton = labelContainer.querySelector(".label-button");
    const labelName = labelButton.textContent;

    // Confirm removal
    const confirmRemoval = confirm(
      `Are you sure you want to remove the custom label "${labelName}"?`
    );
    if (!confirmRemoval) return;

    // Remove from customLabels
    delete customLabels[labelName];

    // Remove the label container from the toolbar
    labelContainer.remove();

    // Optionally, remove annotations using this label
    /*
    for (let noteIdx in annotations) {
      annotations[noteIdx] = annotations[noteIdx].filter(
        (ann) => ann.label !== labelName
      );
    }
    renderAnnotations();
    renderText();
    */
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

  // Add to customLabels
  customLabels[labelName] = labelColor;

  // Create new label container with 'remove-label' span
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

  // Add the new label container to the toolbar
  annotationToolbar.appendChild(labelContainer);

  // Clear input fields
  customLabelName.value = "";
  customLabelColor.value = "#888888";

  // Inform the user that the label was added
  alert(`Custom label "${labelName}" added.`);
});

// Get Selection Indices
function getSelectionIndices(range) {
  const text = notes[currentIndex];
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

    // Annotation text and label
    const textLabelDiv = document.createElement("div");
    textLabelDiv.style.display = "inline-flex";
    textLabelDiv.style.alignItems = "center";
    textLabelDiv.style.gap = "5px";

    const textSpan = document.createElement("span");
    textSpan.textContent = `${index + 1}. "${annotation.text}" (${
      annotation.start_idx
    }-${annotation.end_idx}) -`;

    const labelSpan = document.createElement("span");
    labelSpan.textContent = annotation.label;
    labelSpan.style.color = annotation.color;
    labelSpan.style.fontWeight = "bold";

    textLabelDiv.appendChild(textSpan);
    textLabelDiv.appendChild(labelSpan);

    // Remove button
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
    const noteIdx = parseInt(event.target.getAttribute("data-note-index"));
    const annIdx = parseInt(event.target.getAttribute("data-annotation-index"));
    removeAnnotation(noteIdx, annIdx);
  }
});

// Remove Annotation Function
function removeAnnotation(noteIndex, annotationIndex) {
  if (
    annotations[noteIndex] &&
    annotations[noteIndex].length > annotationIndex
  ) {
    annotations[noteIndex].splice(annotationIndex, 1);
    renderAnnotations();
    renderText();

    // Update sidebar checkmark
    const li = noteList.querySelector(`li[data-index='${noteIndex}']`);
    if (li) {
      if (!annotations[noteIndex] || annotations[noteIndex].length === 0) {
        li.classList.remove("annotated");
      }
    }

    // Disable download button if no annotations left for current note
    if (noteIndex === currentIndex) {
      downloadBtn.disabled = !(
        annotations[currentIndex] && annotations[currentIndex].length > 0
      );
    }
  } else {
    alert("Invalid annotation index.");
  }
// Render Text with Highlights
function renderText() {
  const text = notes[currentIndex];
  if (!text) {
    textDisplay.innerHTML = "No note selected.";
    return;
  }

  if (!annotations[currentIndex] || annotations[currentIndex].length === 0) {
    textDisplay.innerHTML = `<div style="white-space: pre-wrap; word-wrap: break-word; line-height: 1.6;">${escapeHtml(text)}</div>`;
    return;
  } textDisplay.innerHTML = escapeHtml(text);
    return;
  }

  // Use the already sorted annotations
  const sortedAnnotations = annotations[currentIndex];

  // Create an array of all annotation boundaries
  let boundaries = [];
  sortedAnnotations.forEach((ann) => {
    boundaries.push({ index: ann.start_idx, type: "start", ann });
    boundaries.push({ index: ann.end_idx, type: "end", ann });
  });

  // Sort boundaries
  boundaries.sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    // End boundaries should come before start boundaries at the same index
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
        // Apply all active annotations
        let nestedSegment = segment;
        activeAnnotations.forEach((activeAnn) => {
          nestedSegment = `<span class="highlight" style="background-color: ${
            activeAnn.color
          }; color: ${getContrastYIQ(activeAnn.color)};" title="${escapeHtml(
            activeAnn.label
          )}">${nestedSegment}</span>`;
        });
        result += nestedSegment;
      }

      lastIndex = index;
    }

    if (type === "start") {
      activeAnnotations.push(ann);
    } else if (type === "end") {
      // Remove the annotation from activeAnnotations
      activeAnnotations = activeAnnotations.filter((a) => a !== ann);
    }
  });

  // Append any remaining text after the last boundary
  if (lastIndex < text.length) {
    const segment = escapeHtml(text.slice(lastIndex));

    if (activeAnnotations.length === 0) {
      result += segment;
    } else {
      let nestedSegment = segment;
      activeAnnotations.forEach((activeAnn) => {
        nestedSegment = `<span class="highlight" style="background-color: ${
          activeAnn.color
        }; color: ${getContrastYIQ(activeAnn.color)};" title="${escapeHtml(
          activeAnn.label
        )}">${nestedSegment}</span>`;
      });
      result += nestedSegment;
    }
  textDisplay.innerHTML = `<div style="white-space: pre-wrap; word-wrap: break-word; line-height: 1.6;">${result}</div>`;
}

// Handle Download Annotations

// Handle Download Annotations
downloadBtn.addEventListener("click", () => {
  // Get the filename from the input
  let filename = filenameInput.value.trim();

  // Validate and set default filename if necessary
  if (!filename) {
    filename = "annotations.json";
  } else {
    // Ensure the filename ends with .json
    if (!filename.toLowerCase().endsWith(".json")) {
      filename += ".json";
    }
    // Optional: Further validation can be added here (e.g., invalid characters)
  }

  // Filter notes with annotations
  const annotationsData = originalNotes
    .map((note, index) => ({
      note: notes[index],
      annotations: annotations[index] || [],
    }))
    .filter((entry) => entry.annotations.length > 0); // Keep only notes with annotations

  if (annotationsData.length === 0) {
    alert("No annotated notes to download.");
    return;
  }

  const dataToDownload = {
    annotations: annotationsData,
  };

  const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename; // Use the user-defined filename
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
