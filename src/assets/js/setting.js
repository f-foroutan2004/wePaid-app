import api from "./api.js";
import { showToast } from "../../utils/Toast.js";
import "../../utils/notification.js";
import "../../utils/logOut.js";

//Element
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
const usernameElement = document.querySelector("#headerUsername");

// Username
const username = localStorage.getItem("userName");

if (usernameElement) {
  usernameElement.textContent = username || "کاربر";
}

// Skeleton Loading
function showCategorySkeleton() {
  if (!categoryList) return;

  categoryList.innerHTML = `
    <div class="category-skeleton skeleton"></div>
    <div class="category-skeleton skeleton"></div>
    <div class="category-skeleton skeleton"></div>
    <div class="category-skeleton skeleton"></div>
  `;
}

// State
let categories = [];
let editingCategoryId = null;
let selectedIcon = "fa-shopping-cart";
let selectedColor = "#43a047";

let categoryStyles = JSON.parse(localStorage.getItem("categoryStyles") || "{}");

if (!categoryStyles || typeof categoryStyles !== "object") {
  categoryStyles = {};
}

// Category Styles
function saveCategoryStyles() {
  localStorage.setItem("categoryStyles", JSON.stringify(categoryStyles));
}

function getCategoryStyle(categoryId) {
  return (
    categoryStyles[String(categoryId)] || {
      icon: "fa-shopping-cart",
      color: "#43a047",
    }
  );
}

// Load Categories
async function loadCategories() {
  if (categoryList) {
    showCategorySkeleton();
  }

  const token = localStorage.getItem("token");

  if (!token) {
    console.error("Token not found");

    if (categoryList) {
      categoryList.innerHTML = "";
    }

    return;
  }

  try {
    const response = await api.get("/categories");
    const apiCategories = response.data?.data?.categories || [];

    categories = [];

    apiCategories.forEach((category) => {
      const categoryId = category.id;

      const parentStyle = getCategoryStyle(categoryId);
      categories.push({
        id: categoryId,
        name: category.name,
        parentId: null,
        icon: parentStyle.icon,
        color: parentStyle.color,
      });

      if (Array.isArray(category.children) && category.children.length > 0) {
        category.children.forEach((child) => {
          const childId = child.id;
          const childStyle = getCategoryStyle(childId);

          categories.push({
            id: childId,
            name: child.name,
            parentId: categoryId,
            icon: childStyle.icon,
            color: childStyle.color,
          });
        });
      }
    });

    renderCategories();
  } catch (error) {
    if (categoryList) {
      categoryList.innerHTML = `
        <div class="empty-state">
          خطا در دریافت دسته‌بندی‌ها.
        </div>
      `;
    }

    const message =
      error.response?.data?.data?.message || "خطا در دریافت دسته‌بندی‌ها.";

    showToast(message);
  }
}

// Render Categories
function renderCategories() {
  if (!categoryList) return;
  categoryList.innerHTML = "";

  const parentCategories = categories.filter(
    (category) =>
      category.parentId === null ||
      category.parentId === undefined ||
      category.parentId === "",
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

  const parentElement = createCategoryElement(parent, false);
  group.appendChild(parentElement);
  const children = categories.filter(
    (category) =>
      category.parentId !== null &&
      category.parentId !== undefined &&
      String(category.parentId) === String(parent.id),
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

  const main = document.createElement("div");
  main.className = "category-main";

  const dragHandle = document.createElement("div");
  dragHandle.className = "drag-handle";
  dragHandle.title = "جابه‌جایی";
  dragHandle.innerHTML = `
    <i class="fas fa-grip-vertical"></i>
  `;

  const icon = document.createElement("div");
  icon.className = "category-icon";
  const categoryColor = category.color || "#43a047";
  const categoryIcon = category.icon || "fa-shopping-cart";
  icon.style.setProperty("--category-color", categoryColor);
  icon.style.setProperty("--category-bg", hexToRgba(categoryColor, 0.1));

  icon.innerHTML = `
    <i class="fas ${categoryIcon}"></i>
  `;

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

  const actions = document.createElement("div");
  actions.className = "category-actions";

  if (!isSubcategory) {
    const addChildBtn = document.createElement("button");

    addChildBtn.type = "button";
    addChildBtn.className = "category-action-btn add-subcategory-btn";

    addChildBtn.title = "افزودن زیر دسته";

    addChildBtn.innerHTML = `
      <i class="fas fa-plus"></i>
    `;

    addChildBtn.addEventListener("click", () =>
      openCategoryModal(null, category.id),
    );

    actions.appendChild(addChildBtn);
  }

  const editBtn = document.createElement("button");

  editBtn.type = "button";
  editBtn.className = "category-action-btn edit-category-btn";
  editBtn.title = "ویرایش";
  editBtn.innerHTML = `
    <i class="fas fa-pen"></i>
  `;

  editBtn.addEventListener("click", () => openCategoryModal(category.id));
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement("button");

  deleteBtn.type = "button";
  deleteBtn.className = "category-action-btn delete-category-btn";

  deleteBtn.title = "حذف";

  deleteBtn.innerHTML = `
    <i class="fas fa-trash"></i>
  `;

  deleteBtn.addEventListener("click", () => deleteCategory(category.id));

  actions.appendChild(deleteBtn);

  if (!isSubcategory) {
    const children = categories.filter(
      (child) => String(child.parentId) === String(category.id),
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
        if (!subcategoryList) return;
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

// Parent Name
function getParentName(parentId) {
  const parent = categories.find(
    (category) => String(category.id) === String(parentId),
  );

  return parent ? `زیر دسته ${parent.name}` : "زیر دسته";
}

// Hex To RGBA
function hexToRgba(hex, opacity) {
  if (!hex) {
    hex = "#43a047";
  }

  hex = hex.replace("#", "");

  if (hex.length !== 6) {
    return `rgba(67, 160, 71, ${opacity})`;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Open Category Modal

function openCategoryModal(categoryId = null, parentId = null) {
  editingCategoryId = categoryId;

  if (categoryId) {
    const category = categories.find(
      (item) => String(item.id) === String(categoryId),
    );

    if (!category) return;
    categoryModalTitle.textContent = "ویرایش دسته";
    categoryNameInput.value = category.name;
    selectedIcon = category.icon || "fa-shopping-cart";
    selectedColor = category.color || "#43a047";
  } else {
    categoryModalTitle.textContent = "افزودن دسته";
    categoryForm.reset();
    selectedIcon = "fa-shopping-cart";
    selectedColor = "#43a047";
  }

  updateParentSelect();

  parentCategorySelect.value =
    parentId ||
    (categoryId
      ? categories.find((item) => String(item.id) === String(categoryId))
          ?.parentId || ""
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

// Category Modal Events

if (addCategoryBtn) {
  addCategoryBtn.addEventListener("click", () => openCategoryModal());
}

if (closeCategoryModal) {
  closeCategoryModal.addEventListener("click", closeCategoryModalHandler);
}

if (cancelCategory) {
  cancelCategory.addEventListener("click", closeCategoryModalHandler);
}

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

function updateIconPicker() {
  if (!iconPicker) return;

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

function updateColorPicker() {
  if (!colorPicker) return;

  colorPicker.querySelectorAll(".color-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.color === selectedColor);
  });
}

// Category Form
if (categoryForm) {
  categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = categoryNameInput.value.trim();
    const parentId = parentCategorySelect.value || null;
    if (!name) {
      categoryNameInput.classList.add("input-error");
      return;
    }

    categoryNameInput.classList.remove("input-error");

    // Edit
    if (editingCategoryId) {
      try {
        const categoryData = {
          name: name,
          parent_id: parentId,
        };

        await api.put(`/category/update/${editingCategoryId}`, categoryData);
        const category = categories.find(
          (item) => String(item.id) === String(editingCategoryId),
        );

        if (category) {
          category.name = name;
          category.parentId = parentId;
          category.icon = selectedIcon;
          category.color = selectedColor;
        }

        categoryStyles[String(editingCategoryId)] = {
          icon: selectedIcon,
          color: selectedColor,
        };

        saveCategoryStyles();
        await loadCategories();
        closeCategoryModalHandler();
        showToast("دسته‌بندی با موفقیت ویرایش شد.", "success");
      } catch (error) {
        console.error("Update category error:", error);

        showToast(
          error.response?.data?.data?.message || "ویرایش دسته‌بندی انجام نشد.",
        );
      }

      return;
    }

    // Create
    try {
      const categoryData = new FormData();
      categoryData.append("name", name);
      categoryData.append("type", "expense");

      if (parentId) {
        categoryData.append("parent_id", parentId);
      }

      const response = await api.post("/category/create", categoryData);
      const backendId = response.data?.data?.category_id;

      if (!backendId) {
        throw new Error("Category ID not found");
      }

      categoryStyles[String(backendId)] = {
        icon: selectedIcon,
        color: selectedColor,
      };

      saveCategoryStyles();
      await loadCategories();
      closeCategoryModalHandler();
      showToast("دسته‌بندی با موفقیت اضافه شد.", "success");
    } catch (error) {
      showToast(
        error.response?.data?.data?.message || "افزودن دسته‌بندی انجام نشد.",
      );
    }
  });
}

// Update Parent Select
function updateParentSelect() {
  if (!parentCategorySelect) return;

  parentCategorySelect.innerHTML = `
    <option value="">
      بدون والد — دسته اصلی
    </option>
  `;

  const parents = categories.filter(
    (category) =>
      category.parentId === null ||
      category.parentId === undefined ||
      category.parentId === "",
  );

  parents.forEach((category) => {
    if (String(category.id) === String(editingCategoryId)) {
      return;
    }

    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    parentCategorySelect.appendChild(option);
  });
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
    await api.delete(`/category/delete/${categoryId}`);
    delete categoryStyles[String(categoryId)];

    saveCategoryStyles();
    await loadCategories();

    showToast("دسته‌بندی با موفقیت حذف شد.", "success");
  } catch (error) {
    showToast(
      error.response?.data?.data?.message || "حذف دسته با خطا مواجه شد.",
    );
  }
}

// Drag & Drop
let draggedCategoryId = null;

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

function handleDragStart(event) {
  const item = event.currentTarget;

  draggedCategoryId = String(item.dataset.id);
  item.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleDragEnter(event) {
  event.preventDefault();
  const targetItem = event.currentTarget;
  const targetId = String(targetItem.dataset.id);
  if (!draggedCategoryId || targetId === draggedCategoryId) {
    return;
  }

  targetItem.classList.add("drag-over");
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();

  const targetItem = event.currentTarget;
  const targetCategoryId = String(targetItem.dataset.id);

  if (!draggedCategoryId) return;

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
    showToast("امکان انتقال دسته به زیرمجموعه خودش وجود ندارد.");

    return;
  }

  if (
    targetCategory.parentId === null ||
    targetCategory.parentId === undefined
  ) {
    draggedCategory.parentId = targetCategory.id;
  } else {
    draggedCategory.parentId = targetCategory.parentId;
  }

  reorderCategories(draggedCategoryId, targetCategoryId);
  renderCategories();
}

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

function isDescendant(targetId, sourceId) {
  let current = categories.find(
    (category) => String(category.id) === String(targetId),
  );

  while (
    current &&
    current.parentId !== null &&
    current.parentId !== undefined
  ) {
    if (String(current.parentId) === String(sourceId)) {
      return true;
    }

    current = categories.find(
      (category) => String(category.id) === String(current.parentId),
    );
  }

  return false;
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove("dragging");

  if (categoryList) {
    categoryList.querySelectorAll(".drag-over").forEach((item) => {
      item.classList.remove("drag-over");
    });
  }

  draggedCategoryId = null;
}

// TAG MANAGEMENT
const tagManagementList = document.querySelector("#tagManagementList");
const addTagBtn = document.querySelector("#addTagBtn");
const tagModal = document.querySelector("#tagModal");
const closeTagModal = document.querySelector("#closeTagModal");
const cancelTag = document.querySelector("#cancelTag");
const tagForm = document.querySelector("#tagForm");
const tagNameInput = document.querySelector("#tagName");
const tagModalTitle = document.querySelector("#tagModalTitle");
const tagNameError = document.querySelector(".tag-name-error");

let tags = [];
let editingTagId = null;

// Tag Skeleton
function showTagSkeleton() {
  if (!tagManagementList) return;

  tagManagementList.innerHTML = `
    <div class="tag-skeleton skeleton"></div>
    <div class="tag-skeleton skeleton"></div>
    <div class="tag-skeleton skeleton"></div>
  `;
}

// Load Tags
async function loadTags() {
  if (!tagManagementList) return;

  showTagSkeleton();

  const token = localStorage.getItem("token");

  if (!token) {
    console.error("Token not found");
    tagManagementList.innerHTML = "";
    return;
  }

  try {
    const response = await api.get("/tags");
    tags = response.data?.data?.tags || [];

    if (!Array.isArray(tags)) {
      tags = [];
    }

    renderTags();
  } catch (error) {
    tags = [];

    tagManagementList.innerHTML = `
      <div class="empty-state">
        خطا در دریافت برچسب‌ها.
      </div>
    `;

    const message =
      error.response?.data?.data?.message || "خطا در دریافت برچسب‌ها.";

    showToast(message);
  }
}

// Render Tags
function renderTags() {
  if (!tagManagementList) return;
  tagManagementList.innerHTML = "";

  if (tags.length === 0) {
    const emptyState = document.createElement("div");

    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <i class="fas fa-tags"></i>
      <p>
        هنوز هیچ برچسبی ایجاد نشده است.
      </p>
    `;

    tagManagementList.appendChild(emptyState);

    return;
  }

  tags.forEach((tag) => {
    const element = createTagElement(tag);
    tagManagementList.appendChild(element);
  });
}

// Create Tag Element
function createTagElement(tag) {
  const tagId = tag.id;
  const tagName = tag.name;

  const item = document.createElement("div");
  item.className = "tag-management-item";
  item.dataset.id = tagId;
  item.innerHTML = `
    <div class="tag-management-main">
      <div class="tag-management-icon">
        <i class="fas fa-tag"></i>
      </div>
      <div class="tag-management-info">
        <h3>
          ${tagName}
        </h3>
        <span>
          برچسب
        </span>
      </div>
    </div>
    <div class="tag-management-actions">
      <button
        type="button"
        class="tag-action-btn edit-tag-btn"
        title="ویرایش"
      >
        <i class="fas fa-pen"></i>
      </button>
      <button
        type="button"
        class="tag-action-btn delete-tag-btn"
        title="حذف"
      >
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;

  const editButton = item.querySelector(".edit-tag-btn");
  const deleteButton = item.querySelector(".delete-tag-btn");
  editButton.addEventListener("click", () => openTagModal(tagId));
  deleteButton.addEventListener("click", () => deleteTag(tagId));

  return item;
}

// Open Tag Modal
function openTagModal(tagId = null) {
  editingTagId = tagId;

  if (tagId) {
    const tag = tags.find((item) => String(item.id) === String(tagId));

    if (!tag) return;

    tagModalTitle.textContent = "ویرایش برچسب";
    tagNameInput.value = tag.name ?? "";
  } else {
    tagModalTitle.textContent = "افزودن برچسب";

    tagForm.reset();
    tagNameInput.value = "";
  }

  hideTagError();
  tagModal.classList.remove("hidden");
  setTimeout(() => tagNameInput?.focus(), 100);
}

// Close Tag Modal
function closeTagModalHandler() {
  if (!tagModal) return;
  tagModal.classList.add("hidden");
  editingTagId = null;
  tagForm?.reset();
  hideTagError();
}

// Tag Error
function hideTagError() {
  if (tagNameError) {
    tagNameError.classList.add("hidden");
  }

  if (tagNameInput) {
    tagNameInput.classList.remove("input-error");
  }
}

function showTagError() {
  if (tagNameError) {
    tagNameError.classList.remove("hidden");
  }

  if (tagNameInput) {
    tagNameInput.classList.add("input-error");

    tagNameInput.focus();
  }
}

// Tag Modal Events
if (addTagBtn) {
  addTagBtn.addEventListener("click", () => openTagModal());
}

if (closeTagModal) {
  closeTagModal.addEventListener("click", closeTagModalHandler);
}

if (cancelTag) {
  cancelTag.addEventListener("click", closeTagModalHandler);
}

const tagModalOverlay = tagModal?.querySelector(".tagModal-overlay");

if (tagModalOverlay) {
  tagModalOverlay.addEventListener("click", closeTagModalHandler);
}

// Tag Form
if (tagForm) {
  tagForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = tagNameInput.value.trim();

    if (!name) {
      showTagError();
      return;
    }
    hideTagError();

    // Edit
    if (editingTagId) {
      try {
        const tagData = {
          name: name,
        };

        await api.put(`/tag/update/${editingTagId}`, tagData);
        await loadTags();
        closeTagModalHandler();

        showToast("برچسب با موفقیت ویرایش شد.", "success");
      } catch (error) {
        const message =
          error.response?.data?.data?.message || "ویرایش برچسب انجام نشد.";

        showToast(message);
      }

      return;
    }

    // Create
    try {
      const tagData = {
        name: name,
      };

      await api.post("/tag/create", tagData);

      await loadTags();
      closeTagModalHandler();

      showToast("برچسب با موفقیت ایجاد شد.", "success");
    } catch (error) {
      const message =
        error.response?.data?.data?.message || "ایجاد برچسب انجام نشد.";

      showToast(message);
    }
  });
}

// Delete Tag
async function deleteTag(tagId) {
  const tag = tags.find((item) => String(item.id) === String(tagId));
  if (!tag) return;

  const tagName = tag.name ?? "این برچسب";
  const confirmed = confirm(`آیا از حذف «${tagName}» مطمئن هستید؟`);
  if (!confirmed) return;

  try {
    await api.delete(`/tag/delete/${tagId}`);
    await loadTags();

    showToast("برچسب با موفقیت حذف شد.", "success");
  } catch (error) {
    const message =
      error.response?.data?.data?.message || "حذف برچسب انجام نشد.";

    showToast(message);
  }
}

// Initial Load
loadCategories();
await loadTags();
