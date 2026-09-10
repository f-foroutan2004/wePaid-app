import { initProfile } from "./profile.js";
import "./wallet.js";
import api from "./api.js";

initProfile();

// DOM Elements
const categoryList = document.querySelector("#categoryList");
const addCategoryBtn = document.querySelector("#addCategoryBtn");
const categoryModal = document.querySelector("#categoryModal");
const closeCategoryModal = document.querySelector("#closeCategoryModal");
const cancelCategory = document.querySelector("#cancelCategory");
const categoryForm = document.querySelector("#categoryForm");
const categoryModalTitle = document.querySelector("#categoryModalTitle");
const categoryNameInput = document.querySelector("#categoryName");
const parentCategorySelect = document.querySelector("#parentCategory");
const iconPicker = document.querySelector("#iconPicker");
const colorPicker = document.querySelector("#colorPicker");

let categories = JSON.parse(localStorage.getItem("categories") || "[]");
if (!Array.isArray(categories)) {
  categories = [];
}

let editingCategoryId = null;
let selectedIcon = "fa-shopping-cart";
let selectedColor = "#43a047";

function saveCategories() {
  localStorage.setItem("categories", JSON.stringify(categories));
}

// Render Categories
function renderCategories() {
  if (!categoryList) return;

  categoryList.innerHTML = "";
  const parentCategories = categories.filter(
    (category) => category.parentId === null,
  );

  parentCategories.forEach((parent) => {
    const group = createCategoryGroup(parent);

    categoryList.appendChild(group);
  });

  updateParentSelect();
  initializeDragAndDrop();
}

// Create Category Group
function createCategoryGroup(parent) {
  const group = document.createElement("div");
  group.className = "category-group";
  group.dataset.id = parent.id;

  // Parent
  const parentElement = createCategoryElement(parent, false);
  group.appendChild(parentElement);

  // Children
  const children = categories.filter(
    (category) => +category.parentId === +parent.id,
  );

  if (children.length > 0) {
    const subcategoryList = document.createElement("div");
    subcategoryList.className = "subcategory-list";
    subcategoryList.dataset.parentId = parent.id;

    children.forEach((child) => {
      const childElement = createCategoryElement(child, true);
      subcategoryList.appendChild(childElement);
    });

    group.appendChild(subcategoryList);
  }
  return group;
}

// Create Category Element
function createCategoryElement(category, isSubcategory) {
  const item = document.createElement("div");
  item.className = "category-item";

  if (isSubcategory) {
    item.classList.add("subcategory-item");
  } else {
    item.classList.add("parent-category");
  }

  item.draggable = true;
  item.dataset.id = category.id;

  // Main
  const main = document.createElement("div");
  main.className = "category-main";

  // Drag Handle
  const dragHandle = document.createElement("div");
  dragHandle.className = "drag-handle";
  dragHandle.title = "جابه‌جایی";
  dragHandle.innerHTML = `
    <i class="fas fa-grip-vertical"></i>
  `;

  // Icon
  const icon = document.createElement("div");
  icon.className = "category-icon";
  icon.style.setProperty("--category-color", category.color);
  icon.style.setProperty("--category-bg", hexToRgba(category.color, 0.1));

  icon.innerHTML = `
    <i class="fas ${category.icon}"></i>
  `;

  // Info
  const info = document.createElement("div");
  info.className = "category-info";
  info.innerHTML = `
    <h3>${category.name}</h3>
    <span>
      ${isSubcategory ? getParentName(category.parentId) : "دسته اصلی"}
    </span>
  `;

  main.appendChild(dragHandle);
  main.appendChild(icon);
  main.appendChild(info);

  // Actions
  const actions = document.createElement("div");
  actions.className = "category-actions";

  // Add Subcategory
  if (!isSubcategory) {
    const addChildBtn = document.createElement("button");
    addChildBtn.type = "button";
    addChildBtn.className = "category-action-btn add-subcategory-btn";
    addChildBtn.title = "افزودن زیر دسته";
    addChildBtn.innerHTML = `
      <i class="fas fa-plus"></i>
    `;

    addChildBtn.addEventListener("click", () => {
      openCategoryModal(null, category.id);
    });

    actions.appendChild(addChildBtn);
  }

  // Edit
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "category-action-btn edit-category-btn";
  editBtn.title = "ویرایش";
  editBtn.innerHTML = `
    <i class="fas fa-pen"></i>
  `;

  editBtn.addEventListener("click", () => {
    openCategoryModal(category.id);
  });

  actions.appendChild(editBtn);

  // Delete
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "category-action-btn delete-category-btn";
  deleteBtn.title = "حذف";
  deleteBtn.innerHTML = `
    <i class="fas fa-trash"></i>
  `;

  deleteBtn.addEventListener("click", () => {
    deleteCategory(category.id);
  });

  actions.appendChild(deleteBtn);

  // Toggle Children
  if (!isSubcategory) {
    const children = categories.filter(
      (child) => child.parentId === category.id,
    );

    if (children.length > 0) {
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "category-toggle-btn";
      toggleBtn.title = "نمایش زیر دسته‌ها";
      toggleBtn.innerHTML = `
        <i class="fas fa-chevron-down"></i>
      `;

      toggleBtn.addEventListener("click", () => {
        const subcategoryList =
          item.parentElement.querySelector(".subcategory-list");

        if (!subcategoryList) {
          return;
        }

        subcategoryList.classList.toggle("hidden");
        toggleBtn.classList.toggle("collapsed");
      });

      actions.appendChild(toggleBtn);
    }
  }

  item.appendChild(main);
  item.appendChild(actions);
  return item;
}

// Get Parent Name
function getParentName(parentId) {
  const parent = categories.find((category) => category.id === parentId);
  return parent ? `زیر دسته ${parent.name}` : "زیر دسته";
}

// HEX → RGBA=
function hexToRgba(hex, opacity) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Open Category Modal
function openCategoryModal(categoryId = null, parentId = null) {
  editingCategoryId = categoryId;

  // Edit
  if (categoryId) {
    const category = categories.find((item) => item.id === categoryId);

    if (!category) {
      return;
    }

    categoryModalTitle.textContent = "ویرایش دسته";
    categoryNameInput.value = category.name;
    parentCategorySelect.value = category.parentId || "";
    selectedIcon = category.icon;
    selectedColor = category.color;
  }

  // Add
  else {
    categoryModalTitle.textContent = "افزودن دسته";
    categoryForm.reset();
    selectedIcon = "fa-shopping-cart";
    selectedColor = "#43a047";
    parentCategorySelect.value = parentId || "";
  }

  updateParentSelect();

  parentCategorySelect.value =
    parentId ||
    (categoryId
      ? categories.find((item) => item.id === categoryId)?.parentId || ""
      : "");

  updateIconPicker();
  updateColorPicker();

  categoryModal.classList.remove("hidden");
}

// Close Category Modal
function closeCategoryModalHandler() {
  categoryModal.classList.add("hidden");
  editingCategoryId = null;
  categoryForm.reset();
  selectedIcon = "fa-shopping-cart";
  selectedColor = "#43a047";
}

// Add Category Button
if (addCategoryBtn) {
  addCategoryBtn.addEventListener("click", () => {
    openCategoryModal();
  });
}

// Close Buttons
if (closeCategoryModal) {
  closeCategoryModal.addEventListener("click", closeCategoryModalHandler);
}

if (cancelCategory) {
  cancelCategory.addEventListener("click", closeCategoryModalHandler);
}

// Overlay Close
const categoryModalOverlay = categoryModal?.querySelector(
  ".categoryModal-overlay",
);

if (categoryModalOverlay) {
  categoryModalOverlay.addEventListener("click", closeCategoryModalHandler);
}

// Icon Picker
if (iconPicker) {
  iconPicker.querySelectorAll(".icon-option").forEach((button) => {
    button.addEventListener("click", () => {
      selectedIcon = button.dataset.icon;

      updateIconPicker();
    });
  });
}

// Update Icon Picker
function updateIconPicker() {
  if (!iconPicker) {
    return;
  }

  iconPicker.querySelectorAll(".icon-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.icon === selectedIcon);
  });
}

// Color Picker
if (colorPicker) {
  colorPicker.querySelectorAll(".color-option").forEach((button) => {
    button.addEventListener("click", () => {
      selectedColor = button.dataset.color;

      updateColorPicker();
    });
  });
}

// Update Color Picker
function updateColorPicker() {
  if (!colorPicker) {
    return;
  }

  colorPicker.querySelectorAll(".color-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.color === selectedColor);
  });
}

// Submit Category Form
if (categoryForm) {
  categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = categoryNameInput.value.trim();
    const parentId = parentCategorySelect.value || null;

    // Validation
    if (!name) {
      categoryNameInput.classList.add("input-error");
      return;
    }

    categoryNameInput.classList.remove("input-error");

    // Edit
    if (editingCategoryId) {
      try {
        const token = localStorage.getItem("token");

        const categoryData = {
          name: name,
          parent_id: parentId,
        };

        const response = await api.put(
          `/category/update/${editingCategoryId}`,
          categoryData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const category = categories.find(
          (item) => +(item.id) === +(editingCategoryId),
        );

        if (category) {
          category.name = name;
          category.parentId = parentId;
          category.icon = selectedIcon;
          category.color = selectedColor;
        }

        saveCategories();
        renderCategories();
        closeCategoryModalHandler();
      } catch (error) {

        alert(
          error.response?.data?.data?.message ||
            error.response?.data?.message ||
            "ویرایش دسته‌بندی انجام نشد.",
        );
      }

      return;
    }

    // Add
    try {
      const token = localStorage.getItem("token");
      const categoryData = new FormData();
      categoryData.append("name", name);
      categoryData.append("type", "expense");
      if (parentId) {
        categoryData.append("parent_id", parentId);
      }

      const response = await api.post("/category/create", categoryData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const backendId = response.data.data.category_id;
      const newCategory = {
        id: backendId,
        name: name,
        parentId: parentId,
        icon: selectedIcon,
        color: selectedColor,
      };
      categories.push(newCategory);
      saveCategories();

      renderCategories();
      closeCategoryModalHandler();
    } catch (error) {
      console.log(error.response.data);
    }
  });
}

// Update Parent Select
function updateParentSelect() {
  if (!parentCategorySelect) {
    return;
  }

  const currentValue = parentCategorySelect.value;

  parentCategorySelect.innerHTML = `
    <option value="">
      بدون والد — دسته اصلی
    </option>
  `;

  const parents = categories.filter((category) => category.parentId === null);

  parents.forEach((category) => {
    // Don't allow a category to become its own parent
    if (category.id === editingCategoryId) {
      return;
    }

    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    parentCategorySelect.appendChild(option);
  });

  if (parents.some((category) => category.id === currentValue)) {
    parentCategorySelect.value = currentValue;
  }
}

// Delete Category
async function deleteCategory(categoryId) {
  const category = categories.find(
    (item) => String(item.id) === String(categoryId),
  );

  if (!category) return;

  const confirmed = confirm(`آیا از حذف «${category.name}» مطمئن هستید؟`);

  if (!confirmed) return;

  try {
    const token = localStorage.getItem("token");
    await api.delete(`/category/delete/${categoryId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    categories = categories.filter(
      (item) => String(item.id) !== String(categoryId),
    );
    saveCategories();

    const element = categoryList.querySelector(
      `.category-item[data-id="${categoryId}"]`,
    );

    if (element) {
      if (category.parentId === null) {
        const group = element.closest(".category-group");

        if (group) {
          group.remove();
        }
      } else {
        element.remove();
      }
    }
    updateParentSelect();
  } catch (error) {
    console.error(error);

    alert(
      error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "حذف دسته با خطا مواجه شد.",
    );
  }
}

// Drag & Drop
let draggedCategoryId = null;

// Initialize Drag & Drop
function initializeDragAndDrop() {
  if (!categoryList) return;

  const categoryItems = categoryList.querySelectorAll(".category-item");

  categoryItems.forEach((item) => {
    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("dragenter", handleDragEnter);
    item.addEventListener("dragleave", handleDragLeave);
    item.addEventListener("drop", handleDrop);
    item.addEventListener("dragend", handleDragEnd);
  });

  const groups = categoryList.querySelectorAll(".category-group");

  groups.forEach((group) => {
    group.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });
  });
}

// Drag Start
function handleDragStart(event) {
  const item = event.currentTarget;
  draggedCategoryId = String(item.dataset.id);
  item.classList.add("dragging");

  event.dataTransfer.effectAllowed = "move";
}

// Drag Over
function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

// Drag Enter
function handleDragEnter(event) {
  event.preventDefault();

  const targetItem = event.currentTarget;
  const targetId = String(targetItem.dataset.id);

  if (!draggedCategoryId || targetId === draggedCategoryId) {
    return;
  }

  targetItem.classList.add("drag-over");
}

// Drag Leave
function handleDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

// Drop
function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();

  const targetItem = event.currentTarget;
  const targetCategoryId = String(targetItem.dataset.id);

  if (!draggedCategoryId) {
    return;
  }

  if (draggedCategoryId === targetCategoryId) {
    return;
  }

  const draggedCategory = categories.find(
    (category) => String(category.id) === draggedCategoryId,
  );

  const targetCategory = categories.find(
    (category) => String(category.id) === targetCategoryId,
  );

  if (!draggedCategory || !targetCategory) {
    return;
  }

  if (
    String(targetCategory.parentId) === draggedCategoryId ||
    isDescendant(targetCategoryId, draggedCategoryId)
  ) {
    alert("امکان انتقال دسته به زیرمجموعه خودش وجود ندارد.");
    return;
  }

  if (targetCategory.parentId === null) {
    draggedCategory.parentId = targetCategory.id;
  } else {
    draggedCategory.parentId = targetCategory.parentId;
  }

  reorderCategories(draggedCategoryId, targetCategoryId);
  saveCategories();
  renderCategories();
}

// Reorder Categories
function reorderCategories(draggedId, targetId) {
  const draggedIndex = categories.findIndex(
    (category) => String(category.id) === String(draggedId),
  );

  const targetIndex = categories.findIndex(
    (category) => String(category.id) === String(targetId),
  );

  if (draggedIndex === -1 || targetIndex === -1) {
    return;
  }

  const [draggedCategory] = categories.splice(draggedIndex, 1);
  const newTargetIndex = categories.findIndex(
    (category) => String(category.id) === String(targetId),
  );

  categories.splice(newTargetIndex, 0, draggedCategory);
}

// Check Descendant
function isDescendant(targetId, sourceId) {
  let current = categories.find(
    (category) => String(category.id) === String(targetId),
  );

  while (current && current.parentId !== null) {
    if (String(current.parentId) === String(sourceId)) {
      return true;
    }

    current = categories.find(
      (category) => String(category.id) === String(current.parentId),
    );
  }
  return false;
}

// Drag End
function handleDragEnd(event) {
  event.currentTarget.classList.remove("dragging");

  if (categoryList) {
    categoryList.querySelectorAll(".drag-over").forEach((item) => {
      item.classList.remove("drag-over");
    });
  }
  draggedCategoryId = null;
}

// Initial Render
renderCategories();
