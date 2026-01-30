/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
  Dimensions,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from "../services/uploadService";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../../constants/design";

// Generate avatar color from name
const generateColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = (hash % 40) + 160;
  return `hsl(${hue}, 50%, 55%)`;
};

// Avatar Component
const UserAvatar = ({ firstName, lastName, size = 48 }: { firstName: string; lastName: string | null; size?: number }) => {
  let initials = "";
  if (firstName) initials += firstName[0]?.toUpperCase() || "";
  if (lastName) initials += lastName[0]?.toUpperCase() || "";
  else if (firstName && firstName.length > 1) initials = firstName.substring(0, 2).toUpperCase();

  const backgroundColor = generateColor(firstName + (lastName || ""));

  return (
    <View style={[styles.avatar, { backgroundColor, width: size, height: size, borderRadius: size * 0.3 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
};

// Tag Component
const Tag = ({ text }: { text: string }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>#{text}</Text>
  </View>
);

// Post Card Component
interface PostCardProps {
  firstName: string;
  lastName: string | null;
  userName: string;
  userHandle: string;
  content: string;
  title?: string;
  likes: number;
  tags: string[];
  timeAgo: string;
  hasImage?: boolean;
  imageUrl?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  firstName, lastName, userName, userHandle, content, title, likes, tags, timeAgo, hasImage, imageUrl
}) => {
  const { t } = useTranslation();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <UserAvatar firstName={firstName} lastName={lastName} />
        <View style={styles.postUserInfo}>
          <Text style={styles.postUserName}>{userName}</Text>
          <Text style={styles.postUserHandle}>{userHandle} · {timeAgo}</Text>
        </View>
        <TouchableOpacity style={styles.postMenuBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {title ? <Text style={styles.postTitle}>{title}</Text> : null}
      <Text style={styles.postContent}>{content}</Text>

      {/* Image placeholder */}
      {/* Image Display */}
      {imageUrl ? (
        <View style={styles.postImageContainer}>
          <Image 
            source={{ uri: imageUrl }} 
            style={{ width: '100%', height: 250, resizeMode: 'cover' }} 
          />
        </View>
      ) : hasImage && (
        <View style={styles.postImageContainer}>
          <LinearGradient
            colors={['#E0F2F1', '#B2DFDB']}
            style={styles.postImagePlaceholder}
          >
            <Icon name="image" size={32} color={Colors.primary} />
          </LinearGradient>
        </View>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <View style={styles.postTags}>
          {tags.slice(0, 3).map((tag, index) => (
            <Tag key={index} text={tag} />
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postActionBtn} onPress={handleLike}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={22} 
            color={isLiked ? Colors.error : Colors.textSecondary} 
          />
          <Text style={[styles.postActionText, isLiked && { color: Colors.error }]}>{likeCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.postActionBtn}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.postActionText}>{t('community.reply')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.postActionBtn}>
          <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.postActionText}>{t('community.share')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.postActionBtn}>
          <Ionicons name="bookmark-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Interface
interface Observation {
  _id: string;
  user: { _id: string; name: string };
  title?: string;
  description: string;
  tags: string[];
  createdAt: string;
  likes?: any[];
  image?: string;
}

// Main Community Component
const Community = () => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [posts, setPosts] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const API_URL = "https://hackcelestial-kdg.onrender.com/api/observations/"; 

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(API_URL);
        setPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return t('community.justNow');
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAddPost = async () => {
    const token = await AsyncStorage.getItem("token");
    try {
      if (!token) {
        Alert.alert(t('auth.error'), t('community.loginRequired'));
        setModalVisible(false);
        return;
      }

      setUploading(true);
      let uploadedImageUrl = "";

      if (imageUri) {
        const url = await uploadImage(imageUri);
        if (url) {
          uploadedImageUrl = url;
        } else {
          Alert.alert(t('common.error'), "Image upload failed");
          setUploading(false);
          return;
        }
      }

      const postData = {
        title,
        description,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        image: uploadedImageUrl,
      };

      // Use local dev URL if needed, assuming API_URL might need adjustment or is handled by axios base or hardcoded
      // Since API_URL is hardcoded above, I'll respect it but note that uploadService uses a different base for dev.
      // If running locally, you might need to change API_URL manually or make it dynamic similarly.
      // For now, keeping the user's hardcoded URL but be aware of mismatch if developing locally.
      
      const res = await axios.post(API_URL, postData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (res.data && res.data._id) {
        setPosts([res.data, ...posts]);
      }

    } catch (err) {
      console.error(err);
      Alert.alert(t('community.postFailed'), t('common.error')); 
    } finally {
      setModalVisible(false);
      setTitle("");
      setDescription("");
      setTags("");
      setImageUri(null);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0D4F4F', '#1A8585']} style={styles.loadingGradient}>
          <View style={styles.loadingIconCircle}>
            <Icon name="account-group" size={36} color="#fff" />
          </View>
          <Text style={styles.loadingTitle}>{t('community.title')}</Text>
          <Text style={styles.loadingSubtitle}>{t('common.loading')}</Text>
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>{t('community.title')}</Text>
            <Text style={styles.pageSubtitle}>{posts.length} {t('community.postsFromFishers')}</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="search" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Post */}
        <TouchableOpacity style={styles.quickPost} onPress={() => setModalVisible(true)}>
          <View style={styles.quickPostAvatar}>
            <Icon name="account" size={22} color={Colors.textSecondary} />
          </View>
          <Text style={styles.quickPostText}>{t('community.shareWithCommunity')}</Text>
          <View style={styles.quickPostBtn}>
            <Ionicons name="add" size={20} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      </SafeAreaView>

      <FlatList
        data={posts}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const userName = item.user?.name || "Anonymous";
          const nameParts = userName.split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.length > 1 ? nameParts[1] : null;

          return (
            <PostCard
              firstName={firstName}
              lastName={lastName}
              userName={userName}
              userHandle={`@${firstName.toLowerCase()}`}
              title={item.title}
              content={item.description}
              likes={item.likes?.length || 0}
              tags={item.tags || []}
              timeAgo={getTimeAgo(item.createdAt)}
              hasImage={!!item.image}
              imageUrl={item.image}
            />
          );
        }}
        keyExtractor={(item) => item._id}
        ListFooterComponent={<View style={{ height: 120 }} />}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <LinearGradient colors={[Colors.primary, '#1D5A5B']} style={styles.fabGradient}>
          <Ionicons name="create" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('community.createPost')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              onChangeText={setTitle}
              value={title}
              placeholder={t('community.titleOptional')}
              placeholderTextColor={Colors.textTertiary}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              onChangeText={setDescription}
              value={description}
              placeholder={t('community.whatsOnMind')}
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={5}
            />
            <TextInput
              style={styles.input}
              onChangeText={setTags}
              value={tags}
              placeholder={t('community.tagsCommaSeparated')}
              placeholderTextColor={Colors.textTertiary}
            />

            {/* Image Picker */}
            <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
              <Ionicons name="image-outline" size={24} color={Colors.textSecondary} />
              <Text style={styles.imagePickerText}>
                {imageUri ? "Change Image" : "Add Image"}
              </Text>
            </TouchableOpacity>

            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddPost}>
              <LinearGradient colors={[Colors.primary, '#1D5A5B']} style={styles.submitBtnGradient}>
                {uploading ? <ActivityIndicator color="#fff" /> : <Ionicons name="paper-plane" size={20} color="#fff" />}
                <Text style={styles.submitBtnText}>{uploading ? "Posting..." : t('community.post')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background,
  },

  // Loading
  loadingContainer: { 
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  loadingSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },

  // Quick Post
  quickPost: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    gap: 12,
    ...Shadows.sm,
  },
  quickPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickPostText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quickPostBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    paddingHorizontal: 20,
  },

  // Avatar
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: '700',
    color: '#fff',
  },

  // Tag
  tag: {
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Post Card
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    ...Shadows.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  postUserHandle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  postMenuBtn: {
    padding: 4,
  },
  postContent: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: -15,
  },
  postImageContainer: {
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
  postImagePlaceholder: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  postActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 20,
  },
  postActionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.divider,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    padding: 12,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 14,
  },
  imagePickerText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 14,
    marginBottom: 12,
  },
});

export default Community;
