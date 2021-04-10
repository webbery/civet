#pragma once
#include <math.h>

namespace caxios {
  inline float lab_distance(uint32_t rgb1, uint32_t rgb2) {
    unsigned char r1 = rgb1 >> 16;
    unsigned char g1 = (rgb1 >> 8 ) & 255;
    unsigned char b1 = rgb1 & 255;
    unsigned char r2 = rgb2 >> 16;
    unsigned char g2 = (rgb2 >> 8) & 255;
    unsigned char b2 = rgb2 & 255;
    float r = (r1 + r2) / 2.0;
    float dr = r1 - r2;
    float dg = g1 - g2;
    float db = b1 - b2;
    float d = sqrt((2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db);
    return d;
  }
}