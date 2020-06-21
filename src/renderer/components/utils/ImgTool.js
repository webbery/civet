
export default {
  getSrc: (image) => {
    // console.info(image)
    // switch (image.type) {
    //   case 'jpeg':
    //     return image.thumbnail ? ('data:image/jpg;base64,' + image.thumbnail) : image.path
    //   case 'tiff':
    //     return ''
    //   default:
    //     return image.thumbnail ? ('data:image/jpg;base64,' + image.thumbnail) : image.path
    // }
    if (!image) return ''
    return image.path
    // if (!image.thumbnail) return image.path
    // return image.thumbnail
  }
}
