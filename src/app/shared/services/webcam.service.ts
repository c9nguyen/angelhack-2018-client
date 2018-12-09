import * as tf from '@tensorflow/tfjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebcamService {

  private readonly config = {
    video: true,
    audio: false
  }

  constructor() { }

  setup(webcamElement: any) {
    return new Promise((resolve, reject) => {
      // const navigatorAny = navigator;
      // navigator.getUserMedia = navigator.getUserMedia ||
      //     navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
      //     navigatorAny.msGetUserMedia;

      if (navigator.getUserMedia) {
        navigator.getUserMedia(this.config,
          stream => {
            webcamElement.srcObject = stream;
            webcamElement.addEventListener('loadeddata', async () => {
              this.adjustVideoSize(webcamElement, webcamElement.videoWidth, webcamElement.videoHeight);
              resolve();
            }, false);
          },
          error => {
            reject();
          });
      } else {
        reject();
      }
    });
  }

 /**
   * Captures a frame from the webcam and normalizes it between -1 and 1.
   * Returns a batched image (1-element batch) of shape [1, w, h, c].
   */
  capture(webcamElement: any): any {
    return tf.tidy(() => {
      // Reads the image as a Tensor from the webcam <video> element.
      const webcamImage = tf.fromPixels(webcamElement);
      
      // Crop the image so we're using the center square of the rectangular
      // webcam.
      const croppedImage = this.cropImage(webcamImage);

      // Expand the outer most dimension so we have a batch size of 1.
      const batchedImage = croppedImage.expandDims(0);

      // Normalize the image between -1 and 1. The image comes in between 0-255,
      // so we divide by 127 and subtract 1.
      return batchedImage.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
    });
  }

  /**
   * Crops an image tensor so we get a square image with no white space.
   * @param {Tensor4D} img An input image Tensor to crop.
   */
  cropImage(img: any): any {
    const size = Math.min(img.shape[0], img.shape[1]);
    const centerHeight = img.shape[0] / 2;
    const beginHeight = centerHeight - (size / 2);
    const centerWidth = img.shape[1] / 2;
    const beginWidth = centerWidth - (size / 2);
    return img.slice([beginHeight, beginWidth, 0], [size, size, 3]);
  }

  /**
  * Adjusts the video size so we can make a centered square crop without
  * including whitespace.
  * @param {number} width The real width of the video element.
  * @param {number} height The real height of the video element.
  */
  private adjustVideoSize(webcamElement, width: number, height: number) {
    const aspectRatio = width / height;
    if (width >= height) {
      webcamElement.width = aspectRatio * webcamElement.height;
    } else if (width < height) {
      webcamElement.height = webcamElement.width / aspectRatio;
    }
  }
}