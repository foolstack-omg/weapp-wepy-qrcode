import wepy from 'wepy'

// 服务器接口地址
// const host = __BASE_URL__
const host = __BASE_URL__

// 普通请求
const request = async (options, showLoading = true) => {
    let finalOptions = JSON.parse(JSON.stringify(options)) // 深复制

    // 简化开发，如果传入字符串则转换成 对象
    if (typeof finalOptions === 'string') {
        finalOptions = {
            url: finalOptions
        }
    }
    // 显示加载中
    if (showLoading) {
        wepy.showLoading({title: '加载中', mask: true})
    }
    // 拼接请求地址
    finalOptions.url = host + '/' + finalOptions.url
    // 调用小程序的 request 方法
    let response = await wepy.request(finalOptions)

    if (showLoading) {
        // 隐藏加载中
        wepy.hideLoading()
    }

    // 服务器异常后给与提示
    if (response.statusCode !== 200) {
        wepy.showModal({
            title: '提示',
            content: '服务器错误，请联系管理员或重试'
        })
    }
    return response
}

// 登录
const login = async (params = {}) => {
    wepy.showLoading({title: '加载中'})
    // code 只能使用一次，所以每次单独调用
    let loginData = await wepy.login()

    console.log(loginData);

    // 参数中增加code
    params.code = loginData.code

    let settingData = await wepy.getSetting()

    wepy.hideLoading()

    console.log('setting data')
    console.log(settingData)
    if (!settingData.authSetting['scope.userInfo']) {
        console.log('用户没有授权')
        console.log(settingData.authSetting['scope.userInfo'])
        return false
    } else {
        console.log('用户已授权')
        console.log(settingData.authSetting['scope.userInfo'])

        let userInfoData = await wepy.getUserInfo()
        console.log(userInfoData)
        let userInfo = userInfoData.userInfo
        params.name = userInfo.nickName
        params.avatar_url = userInfo.avatarUrl
        params.gender = userInfo.gender
        params.country = userInfo.country
        params.city = userInfo.city
        params.province = userInfo.province
    }

    // 接口请求 weapp/authorizations
    let authResponse = await request({
        url: 'weapp/authorizations',
        data: params,
        method: 'POST'
    })

    // 登录成功，记录 token 信息
    if (authResponse.data.status === 1) {
        wepy.setStorageSync('access_token', authResponse.data.data.access_token)
        wepy.setStorageSync('access_token_expired_at', new Date().getTime() + authResponse.data.data.expires_in * 1000)

        let response = await authRequest({
            url: 'user'
        })
        if (response.data.status === 1) {
            wepy.setStorageSync('user', response.data.data)
        } else {
            wepy.showToast({
                title: '授权登录 - 获取用户信息失败',
                icon: 'none',
                duration: 1500
            })
        }
    } else {
        wepy.showToast({
            title: '授权登录失败',
            icon: 'none',
            duration: 1500
        })
    }
    return authResponse
}

// 刷新 Token
const refreshToken = async (accessToken) => {
    // 请求刷新接口
    let refreshResponse = await wepy.request({
        url: host + '/' + 'authorizations/update',
        method: 'POST',
        header: {
            'Authorization': 'Bearer ' + accessToken
        }
    })

    // 刷新成功状态码为 200
    if (refreshResponse.data.status === 1) {
        // 将 Token 及过期时间保存在 storage 中
        wepy.setStorageSync('access_token', refreshResponse.data.data.access_token)
        wepy.setStorageSync('access_token_expired_after', new Date().getTime() + refreshResponse.data.data.expired_after * 1000)
    }

    return refreshResponse
}

// 获取 Token
const getToken = async (options) => {
    // 从缓存中取出 Token
    let accessToken = wepy.getStorageSync('access_token')
    let expiredAt = wepy.getStorageSync('access_token_expired_after')

    // 如果 token 过期了，则调用刷新方法
    if (accessToken && new Date().getTime() > expiredAt) {
        let refreshResponse = await refreshToken(accessToken)

        // 刷新成功
        if (refreshResponse.data.status === 1) {
            accessToken = refreshResponse.data.data.access_token
        } else {
            // 刷新失败了，重新调用登录方法，设置 Token
            return false
        }
    }

    return accessToken
}

// 带身份认证的请求
const authRequest = async (options, showLoading = true) => {
    // 检查微信小程序登录态是否失效
    try{
        let session = await wepy.checkSession()
        console.log('Session:' + JSON.stringify(session))
    }catch(e) {
        // 小程序登录态失效， 重新登录
        return false
    }

    if (typeof options === 'string') {
        options = {
            url: options
        }
    }
    // 获取Token
    let accessToken = await getToken()
    if(false === accessToken) {
        return false
    }

    // 将 Token 设置在 header 中
    let header = options.header || {}
    header.Authorization = 'Bearer ' + accessToken
    options.header = header

    let response = await request(options, showLoading)
    console.log(response)
    if (response.statusCode === 401 || response.data.status_code === 401) {
        wepy.clearStorage()
        console.log(loginResponse)
        return false
    }
    return response
}

//  退出登录
const logout = async (params = {}) => {
    let accessToken = wepy.getStorageSync('access_token')
    // 调用删除 Token 接口，让 Token 失效
    let logoutResponse = await wepy.request({
        url: host + '/' + 'authorizations/destroy',
        method: 'POST',
        header: {
            'Authorization': 'Bearer ' + accessToken
        }
    })

    wepy.clearStorage()

    return logoutResponse
}

const uploadFile = async (options = {}) => {
    // 显示loading
    wepy.showLoading({title: '上传中'})

    // 获取 token
    let accessToken = await getToken()

    // 拼接url
    options.url = host + '/' + options.url
    let header = options.header || {}
    // 将 token 设置在 header 中
    header.Authorization = 'Bearer ' + accessToken
    options.header = header

    // 上传文件
    let response = await wepy.uploadFile(options)

    // 隐藏 loading
    wepy.hideLoading()

    return response
}

export default {
    host,
    request,
    authRequest,
    getToken,
    refreshToken,
    login,
    logout,
    uploadFile
}
