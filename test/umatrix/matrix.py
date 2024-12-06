import os
import random
import numpy as np
import json
import matplotlib.pyplot
import pickle
from matplotlib.pyplot import imshow
from PIL import Image
from sklearn.manifold import TSNE
import cv2
import os
import glob

print(TSNE)

num_images_to_plot = 1000
images = []
for img in glob.glob("tmp/umatrix/*.png"):
  images.append(img)
  
print(images[0])