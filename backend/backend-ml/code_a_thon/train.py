import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import json
import os

# -------------------------
# Basic config
# -------------------------
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 10

TRAIN_DIR = "datasets/train"
VAL_DIR = "datasets/valid"

# -------------------------
# Data generators
# Only folders are treated as classes
# Loose files + XML are ignored
# -------------------------
train_gen = ImageDataGenerator(
    rotation_range=25,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.2,
    horizontal_flip=True
)

val_gen = ImageDataGenerator()


train_data = train_gen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="categorical"
)

val_data = val_gen.flow_from_directory(
    VAL_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="categorical"
)

NUM_CLASSES = train_data.num_classes
print("Number of classes:", NUM_CLASSES)

# -------------------------
# Model: EfficientNetB0
# -------------------------
base_model = EfficientNetB0(
    weights="imagenet",
    include_top=False,
    input_shape=(IMG_SIZE, IMG_SIZE, 3)
)

# Freeze base model
base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(256, activation="relu")(x)
x = Dropout(0.25)(x)
outputs = Dense(NUM_CLASSES, activation="softmax")(x)

model = Model(inputs=base_model.input, outputs=outputs)

# -------------------------
# Compile
# -------------------------
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=3e-5),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# -------------------------
# Train
# -------------------------
history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=EPOCHS
)

# -------------------------
# Fine-tuning
# -------------------------
base_model.trainable = True

# Freeze only early layers
for layer in base_model.layers[:100]:
    layer.trainable = False


model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

fine_tune_epochs = 20

model.fit(
    train_data,
    validation_data=val_data,
    epochs=fine_tune_epochs
)


# -------------------------
# Save model
# -------------------------
os.makedirs("model", exist_ok=True)
model.save("model/fish_classifier.h5")

# Save class indices (VERY IMPORTANT)
with open("model/class_indices.json", "w") as f:
    json.dump(train_data.class_indices, f)

print("Training complete. Model saved.")
